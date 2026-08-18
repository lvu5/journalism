'use client'

import Link from 'next/link'
import { useActionState } from 'react'

import {
  initialAuthState,
  requestPasswordResetAction,
  updatePasswordAction,
  type AuthFormState,
} from '@/app/(frontend)/auth/actions'
import { CaptchaField } from '@/components/CaptchaField'
import type { Locale } from '@/lib/i18n'

export function PasswordForm({ locale, mode }: { locale: Locale; mode: 'request' | 'update' }) {
  const action = mode === 'request' ? requestPasswordResetAction : updatePasswordAction
  const [state, formAction, isPending] = useActionState(action, initialAuthState)
  const copy =
    locale === 'vi'
      ? {
          email: 'Email',
          password: 'Mật khẩu mới',
          confirm: 'Xác nhận mật khẩu',
          passwordHelp: 'Ít nhất 12 ký tự.',
          request: 'Gửi liên kết',
          update: 'Đổi mật khẩu',
          requesting: 'Đang gửi…',
          updating: 'Đang cập nhật…',
          back: 'Quay lại đăng nhập',
        }
      : {
          email: 'Email',
          password: 'New password',
          confirm: 'Confirm password',
          passwordHelp: 'At least 12 characters.',
          request: 'Send reset link',
          update: 'Update password',
          requesting: 'Sending…',
          updating: 'Updating…',
          back: 'Back to login',
        }

  const fieldError = (field: keyof NonNullable<AuthFormState['fieldErrors']>) =>
    state.fieldErrors?.[field] ? (
      <small className="form-field-error" id={`${field}-error`}>
        {state.fieldErrors[field]}
      </small>
    ) : null

  return (
    <form action={formAction} className="auth-form">
      <input name="locale" type="hidden" value={locale} />
      {mode === 'request' ? (
        <div className="form-field">
          <label htmlFor="email">{copy.email}</label>
          <input
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
      ) : (
        <>
          <div className="form-field">
            <label htmlFor="password">{copy.password}</label>
            <input
              aria-invalid={Boolean(state.fieldErrors?.password)}
              autoComplete="new-password"
              id="password"
              maxLength={128}
              minLength={12}
              name="password"
              required
              type="password"
            />
            <small>{copy.passwordHelp}</small>
            {fieldError('password')}
          </div>
          <div className="form-field">
            <label htmlFor="passwordConfirm">{copy.confirm}</label>
            <input
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
        </>
      )}

      {mode === 'request' && <CaptchaField locale={locale} resetSignal={state} />}
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
            ? mode === 'request'
              ? copy.requesting
              : copy.updating
            : mode === 'request'
              ? copy.request
              : copy.update}
        </span>
        <span aria-hidden="true">→</span>
      </button>
      <p className="auth-alternate">
        <Link href="/login">{copy.back}</Link>
      </p>
    </form>
  )
}
