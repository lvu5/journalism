import type { Metadata } from 'next'
import { redirect } from 'next/navigation'

import { AuthForm } from '@/components/AuthForm'
import { getCurrentUser, safeNextPath } from '@/lib/auth'
import { getLocale } from '@/lib/get-locale'

type LoginPageProps = { searchParams: Promise<{ error?: string; next?: string }> }

export const dynamic = 'force-dynamic'

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getLocale()) === 'vi' ? 'Đăng nhập' : 'Log in' }
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const locale = await getLocale()
  const params = await searchParams
  const nextPath = safeNextPath(params.next, '/author')
  if (await getCurrentUser()) redirect(nextPath)
  const copy = locale === 'vi'
    ? { kicker: 'Tài khoản', title: 'Đăng nhập', intro: 'Tiếp tục vào khu vực tác giả và các công cụ biên tập.' }
    : { kicker: 'Account', title: 'Log in', intro: 'Continue to the author area and editorial tools.' }

  return (
    <div className="auth-page shell">
      <header className="auth-intro">
        <p className="section-kicker">{copy.kicker}</p>
        <h1>{copy.title}</h1>
        <p>{copy.intro}</p>
      </header>
      <AuthForm
        locale={locale}
        mode="login"
        nextPath={nextPath}
        notice={params.error === 'confirmation'
          ? (locale === 'vi'
              ? 'Liên kết xác nhận không hợp lệ hoặc đã hết hạn. Vui lòng thử đăng nhập hoặc đăng ký lại.'
              : 'The confirmation link is invalid or expired. Try signing in or registering again.')
          : undefined}
      />
    </div>
  )
}
