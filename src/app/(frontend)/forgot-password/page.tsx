import type { Metadata } from 'next'

import { PasswordForm } from '@/components/PasswordForm'
import { getLocale } from '@/lib/get-locale'

export const dynamic = 'force-dynamic'

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getLocale()) === 'vi' ? 'Quên mật khẩu' : 'Forgot password' }
}

export default async function ForgotPasswordPage() {
  const locale = await getLocale()
  const copy = locale === 'vi'
    ? { kicker: 'Tài khoản', title: 'Đặt lại mật khẩu', intro: 'Nhập email của bạn. Nếu tài khoản tồn tại, chúng tôi sẽ gửi một liên kết bảo mật.' }
    : { kicker: 'Account', title: 'Reset password', intro: 'Enter your email. If the account exists, we will send a secure reset link.' }

  return (
    <div className="auth-page shell">
      <header className="auth-intro">
        <p className="section-kicker">{copy.kicker}</p>
        <h1>{copy.title}</h1>
        <p>{copy.intro}</p>
      </header>
      <PasswordForm locale={locale} mode="request" />
    </div>
  )
}
