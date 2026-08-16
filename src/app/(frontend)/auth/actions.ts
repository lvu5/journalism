'use server'

import { redirect } from 'next/navigation'

import { syncSupabaseAuthor } from '@/lib/author-identity'
import { safeNextPath } from '@/lib/auth'
import type { Locale } from '@/lib/i18n'
import { createSupabaseServerClient } from '@/lib/supabase/server'

export type AuthFormState = {
  status: 'idle' | 'success' | 'error'
  message: string
  fieldErrors?: Partial<Record<'email' | 'name' | 'password' | 'passwordConfirm', string>>
}

export const initialAuthState: AuthFormState = { status: 'idle', message: '' }

const valueOf = (formData: FormData, name: string) => {
  const value = formData.get(name)
  return typeof value === 'string' ? value.trim() : ''
}

const localeOf = (formData: FormData): Locale =>
  valueOf(formData, 'locale') === 'en' ? 'en' : 'vi'

const messageFor = (locale: Locale, vi: string, en: string) => (locale === 'vi' ? vi : en)

const captchaRequired = Boolean(process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY)

const missingCaptchaState = (locale: Locale): AuthFormState => ({
  status: 'error',
  message: messageFor(
    locale,
    'Vui lòng hoàn thành bước xác minh chống thư rác.',
    'Complete the anti-spam verification.',
  ),
})

const authCallbackURL = (nextPath: string) => {
  const siteURL = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
  const callback = new URL('/auth/callback', siteURL)
  callback.searchParams.set('next', safeNextPath(nextPath, '/author'))
  return callback.toString()
}

const configurationError = (locale: Locale): AuthFormState => ({
  status: 'error',
  message: messageFor(
    locale,
    'Đăng nhập chưa được cấu hình. Vui lòng liên hệ quản trị viên.',
    'Sign-in has not been configured. Please contact an administrator.',
  ),
})

export async function loginAction(
  _previousState: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const locale = localeOf(formData)
  const email = valueOf(formData, 'email').toLowerCase()
  const password = valueOf(formData, 'password')
  const captchaToken = valueOf(formData, 'captchaToken')
  const nextPath = safeNextPath(valueOf(formData, 'next'), '/author')

  if (!email || !password) {
    return {
      status: 'error',
      message: messageFor(locale, 'Nhập email và mật khẩu.', 'Enter your email and password.'),
    }
  }
  if (captchaRequired && !captchaToken) return missingCaptchaState(locale)

  try {
    const supabase = await createSupabaseServerClient()
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
      ...(captchaToken ? { options: { captchaToken } } : {}),
    })
    if (error || !data.user) {
      return {
        status: 'error',
        message: messageFor(
          locale,
          'Không thể đăng nhập. Kiểm tra email, mật khẩu hoặc xác nhận email.',
          'Unable to sign in. Check your email, password, or email confirmation.',
        ),
      }
    }

    try {
      await syncSupabaseAuthor(data.user)
    } catch (error) {
      console.error('[auth] could not link Supabase author to Payload', error)
      await supabase.auth.signOut()
      return {
        status: 'error',
        message: messageFor(
          locale,
          'Không thể mở hồ sơ tác giả. Tài khoản biên tập cần đăng nhập tại /admin.',
          'Unable to open the author profile. Editorial staff must sign in at /admin.',
        ),
      }
    }
  } catch (error) {
    console.error('[auth] Supabase login failed', error)
    return configurationError(locale)
  }

  redirect(nextPath)
}

export async function registerAction(
  _previousState: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const locale = localeOf(formData)
  const message = (vi: string, en: string) => messageFor(locale, vi, en)
  const publicName = valueOf(formData, 'name')
  const email = valueOf(formData, 'email').toLowerCase()
  const password = valueOf(formData, 'password')
  const passwordConfirm = valueOf(formData, 'passwordConfirm')
  const captchaToken = valueOf(formData, 'captchaToken')
  const nextPath = safeNextPath(valueOf(formData, 'next'), '/author')

  // Quietly absorb automated submissions without creating an account.
  if (valueOf(formData, 'website')) {
    return {
      status: 'error',
      message: message('Không thể tạo tài khoản.', 'Unable to create the account.'),
    }
  }

  const fieldErrors: AuthFormState['fieldErrors'] = {}
  if (publicName.length < 2 || publicName.length > 100) {
    fieldErrors.name = message(
      'Tên cần từ 2 đến 100 ký tự.',
      'Name must be between 2 and 100 characters.',
    )
  }
  if (email.length > 254 || !/^\S+@\S+\.\S+$/.test(email)) {
    fieldErrors.email = message('Nhập địa chỉ email hợp lệ.', 'Enter a valid email address.')
  }
  if (password.length < 12 || password.length > 128) {
    fieldErrors.password = message(
      'Mật khẩu cần từ 12 đến 128 ký tự.',
      'Password must be between 12 and 128 characters.',
    )
  }
  if (password !== passwordConfirm) {
    fieldErrors.passwordConfirm = message(
      'Mật khẩu xác nhận không khớp.',
      'The confirmation password does not match.',
    )
  }
  if (Object.keys(fieldErrors).length) {
    return {
      status: 'error',
      message: message('Kiểm tra lại thông tin.', 'Check the highlighted fields.'),
      fieldErrors,
    }
  }
  if (captchaRequired && !captchaToken) return missingCaptchaState(locale)

  try {
    const supabase = await createSupabaseServerClient()
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        ...(captchaToken ? { captchaToken } : {}),
        data: { public_name: publicName },
        emailRedirectTo: authCallbackURL(nextPath),
      },
    })

    if (error) {
      return {
        status: 'error',
        message: message(
          'Không thể tạo tài khoản. Vui lòng kiểm tra thông tin hoặc thử lại sau.',
          'Unable to create the account. Check the details or try again later.',
        ),
      }
    }

    // Projects may disable email confirmation during local development. In
    // that case Supabase returns a session immediately, so finish the mapping.
    if (data.session && data.user) {
      await syncSupabaseAuthor(data.user)
      redirect(nextPath)
    }

    return {
      status: 'success',
      message: message(
        'Kiểm tra email để xác nhận tài khoản, sau đó bạn có thể đăng nhập.',
        'Check your email to confirm the account, then you can sign in.',
      ),
    }
  } catch (error) {
    // Next.js redirects are errors internally and must not be converted to a
    // configuration message after a successful instant-confirm signup.
    if (error && typeof error === 'object' && 'digest' in error) throw error
    console.error('[auth] Supabase registration failed', error)
    return configurationError(locale)
  }
}

export async function requestPasswordResetAction(
  _previousState: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const locale = localeOf(formData)
  const email = valueOf(formData, 'email').toLowerCase()
  const captchaToken = valueOf(formData, 'captchaToken')
  if (email.length > 254 || !/^\S+@\S+\.\S+$/.test(email)) {
    return {
      status: 'error',
      message: messageFor(locale, 'Nhập địa chỉ email hợp lệ.', 'Enter a valid email address.'),
      fieldErrors: { email: messageFor(locale, 'Email không hợp lệ.', 'Invalid email.') },
    }
  }
  if (captchaRequired && !captchaToken) return missingCaptchaState(locale)

  try {
    const supabase = await createSupabaseServerClient()
    await supabase.auth.resetPasswordForEmail(email, {
      ...(captchaToken ? { captchaToken } : {}),
      redirectTo: authCallbackURL('/update-password'),
    })
  } catch (error) {
    console.error('[auth] password reset request failed', error)
    return configurationError(locale)
  }

  // Do not reveal whether an address is registered.
  return {
    status: 'success',
    message: messageFor(
      locale,
      'Nếu email đã đăng ký, bạn sẽ nhận được liên kết đặt lại mật khẩu.',
      'If that email is registered, you will receive a password reset link.',
    ),
  }
}

export async function updatePasswordAction(
  _previousState: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const locale = localeOf(formData)
  const password = valueOf(formData, 'password')
  const passwordConfirm = valueOf(formData, 'passwordConfirm')
  const fieldErrors: AuthFormState['fieldErrors'] = {}

  if (password.length < 12 || password.length > 128) {
    fieldErrors.password = messageFor(
      locale,
      'Mật khẩu cần từ 12 đến 128 ký tự.',
      'Password must be between 12 and 128 characters.',
    )
  }
  if (password !== passwordConfirm) {
    fieldErrors.passwordConfirm = messageFor(
      locale,
      'Mật khẩu xác nhận không khớp.',
      'The confirmation password does not match.',
    )
  }
  if (Object.keys(fieldErrors).length) {
    return {
      status: 'error',
      message: messageFor(locale, 'Kiểm tra lại thông tin.', 'Check the highlighted fields.'),
      fieldErrors,
    }
  }

  try {
    const supabase = await createSupabaseServerClient()
    const { data: current } = await supabase.auth.getUser()
    if (!current.user) {
      return {
        status: 'error',
        message: messageFor(
          locale,
          'Liên kết đặt lại mật khẩu đã hết hạn. Vui lòng yêu cầu liên kết mới.',
          'The password reset link has expired. Request a new link.',
        ),
      }
    }
    const { error } = await supabase.auth.updateUser({ password })
    if (error) throw error
  } catch (error) {
    console.error('[auth] password update failed', error)
    return configurationError(locale)
  }

  redirect('/author?password=updated')
}

export async function logoutAction() {
  try {
    const supabase = await createSupabaseServerClient()
    await supabase.auth.signOut()
  } catch (error) {
    console.error('[auth] Supabase logout failed', error)
  }
  redirect('/')
}
