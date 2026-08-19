'use client'

import Link from 'next/link'
import { useActionState } from 'react'

import { loginAction, registerAction } from '@/app/(frontend)/auth/actions'
import { CaptchaField } from '@/components/CaptchaField'
import { initialAuthState, type AuthFormState } from '@/lib/auth-form-state'
import type { Locale } from '@/lib/i18n'

type AuthFormProps = {
  locale: Locale
  mode: 'login' | 'register'
  nextPath: string
  notice?: string
}

export function AuthForm({ locale, mode, nextPath, notice }: AuthFormProps) {
  const action = mode === 'login' ? loginAction : registerAction
  const [state, formAction, isPending] = useActionState(action, initialAuthState)
  const copy =
    locale === 'vi'
      ? {
          name: 'Tên hiển thị',
          email: 'Email',
          password: 'Mật khẩu',
          confirm: 'Xác nhận mật khẩu',
          passwordHelp: 'Ít nhất 12 ký tự.',
          login: 'Đăng nhập',
          register: 'Đăng ký',
          loggingIn: 'Đang đăng nhập…',
          registering: 'Đang tạo tài khoản…',
          newHere: 'Chưa có tài khoản?',
          haveAccount: 'Đã có tài khoản?',
          createAccount: 'Tạo tài khoản',
          signIn: 'Đăng nhập',
          forgot: 'Quên mật khẩu?',
          honeypot: 'Không điền ô này',
        }
      : {
          name: 'Display name',
          email: 'Email',
          password: 'Password',
          confirm: 'Confirm password',
          passwordHelp: 'At least 12 characters.',
          login: 'Log in',
          register: 'Register',
          loggingIn: 'Signing in…',
          registering: 'Creating account…',
          newHere: 'New here?',
          haveAccount: 'Already have an account?',
          createAccount: 'Create an account',
          signIn: 'Log in',
          forgot: 'Forgot password?',
          honeypot: 'Leave this field empty',
        }

  const fieldError = (field: keyof NonNullable<AuthFormState['fieldErrors']>) =>
    state.fieldErrors?.[field] ? (
      <small className="form-field-error" id={`${field}-error`}>
        {state.fieldErrors[field]}
      </small>
    ) : null

  const alternateHref = `${mode === 'login' ? '/register' : '/login'}${
    nextPath !== '/' ? `?next=${encodeURIComponent(nextPath)}` : ''
  }`

  return (
    <form action={formAction} className="auth-form">
      <input name="locale" type="hidden" value={locale} />
      <input name="next" type="hidden" value={nextPath} />
      {mode === 'register' && (
        <>
          <div aria-hidden="true" className="form-honeypot">
            <label htmlFor="website">{copy.honeypot}</label>
            <input autoComplete="off" id="website" name="website" tabIndex={-1} type="text" />
          </div>
          <div className="form-field">
            <label htmlFor="name">{copy.name}</label>
            <input
              aria-describedby={state.fieldErrors?.name ? 'name-error' : undefined}
              aria-invalid={Boolean(state.fieldErrors?.name)}
              autoComplete="name"
              id="name"
              maxLength={100}
              minLength={2}
              name="name"
              required
              type="text"
            />
            {fieldError('name')}
          </div>
        </>
      )}

      <div className="form-field">
        <label htmlFor="email">{copy.email}</label>
        <input
          aria-describedby={state.fieldErrors?.email ? 'email-error' : undefined}
          aria-invalid={Boolean(state.fieldErrors?.email)}
          autoComplete="email"
          id="email"
          maxLength={254}
          name="email"
          required
          type="email"
        />
        {fieldError('email')}
      </div>

      <div className="form-field">
        <label htmlFor="password">{copy.password}</label>
        <input
          aria-describedby={
            mode === 'register'
              ? `password-help${state.fieldErrors?.password ? ' password-error' : ''}`
              : undefined
          }
          aria-invalid={Boolean(state.fieldErrors?.password)}
          autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
          id="password"
          maxLength={128}
          minLength={mode === 'register' ? 12 : undefined}
          name="password"
          required
          type="password"
        />
        {mode === 'register' && <small id="password-help">{copy.passwordHelp}</small>}
        {fieldError('password')}
      </div>

      {mode === 'register' && (
        <div className="form-field">
          <label htmlFor="passwordConfirm">{copy.confirm}</label>
          <input
            aria-describedby={
              state.fieldErrors?.passwordConfirm ? 'passwordConfirm-error' : undefined
            }
            aria-invalid={Boolean(state.fieldErrors?.passwordConfirm)}
            autoComplete="new-password"
            id="passwordConfirm"
            maxLength={128}
            minLength={12}
            name="passwordConfirm"
            required
            type="password"
          />
          {fieldError('passwordConfirm')}
        </div>
      )}

      <CaptchaField locale={locale} resetSignal={state} />
      {notice && (
        <p className="form-message form-message-error" role="alert">
          {notice}
        </p>
      )}
      {state.message && (
        <p
          className={`form-message form-message-${state.status}`}
          role={state.status === 'error' ? 'alert' : 'status'}
        >
          {state.message}
        </p>
      )}

      <button className="primary-button" disabled={isPending} type="submit">
        <span>
          {isPending
            ? mode === 'login'
              ? copy.loggingIn
              : copy.registering
            : mode === 'login'
              ? copy.login
              : copy.register}
        </span>
        <span aria-hidden="true">→</span>
      </button>

      <p className="auth-alternate">
        {mode === 'login' ? copy.newHere : copy.haveAccount}{' '}
        <Link href={alternateHref}>{mode === 'login' ? copy.createAccount : copy.signIn}</Link>
      </p>
      {mode === 'login' && (
        <p className="auth-alternate">
          <Link href="/forgot-password">{copy.forgot}</Link>
        </p>
      )}
    </form>
  )
}
