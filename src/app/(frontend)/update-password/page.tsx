import type { Metadata } from 'next'
import { redirect } from 'next/navigation'

import { PasswordForm } from '@/components/PasswordForm'
import { getCurrentUser } from '@/lib/auth'
import { getLocale } from '@/lib/get-locale'

export const dynamic = 'force-dynamic'

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getLocale()) === 'vi' ? 'Đổi mật khẩu' : 'Update password' }
}

export default async function UpdatePasswordPage() {
  const locale = await getLocale()
  if (!await getCurrentUser()) redirect('/forgot-password')
  const copy = locale === 'vi'
    ? { kicker: 'Tài khoản', title: 'Mật khẩu mới', intro: 'Chọn mật khẩu mới cho tài khoản tác giả của bạn.' }
    : { kicker: 'Account', title: 'New password', intro: 'Choose a new password for your author account.' }

  return (
    <div className="auth-page shell">
      <header className="auth-intro">
        <p className="section-kicker">{copy.kicker}</p>
        <h1>{copy.title}</h1>
        <p>{copy.intro}</p>
      </header>
      <PasswordForm locale={locale} mode="update" />
    </div>
  )
}
