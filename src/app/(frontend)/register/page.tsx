import type { Metadata } from 'next'
import { redirect } from 'next/navigation'

import { AuthForm } from '@/components/AuthForm'
import { getCurrentUser, safeNextPath } from '@/lib/auth'
import { getLocale } from '@/lib/get-locale'

type RegisterPageProps = { searchParams: Promise<{ next?: string }> }

export const dynamic = 'force-dynamic'

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getLocale()) === 'vi' ? 'Đăng ký' : 'Register' }
}

export default async function RegisterPage({ searchParams }: RegisterPageProps) {
  const locale = await getLocale()
  const nextPath = safeNextPath((await searchParams).next, '/author')
  if (await getCurrentUser()) redirect(nextPath)
  const copy = locale === 'vi'
    ? { kicker: 'Tài khoản tác giả', title: 'Đăng ký', intro: 'Tài khoản mới bắt đầu với vai trò Tác giả sau khi xác nhận email. Quản trị viên kiểm soát mọi quyền cao hơn.' }
    : { kicker: 'Author account', title: 'Register', intro: 'New accounts begin as Authors after email confirmation. An administrator controls all higher access.' }

  return (
    <div className="auth-page shell">
      <header className="auth-intro">
        <p className="section-kicker">{copy.kicker}</p>
        <h1>{copy.title}</h1>
        <p>{copy.intro}</p>
      </header>
      <AuthForm locale={locale} mode="register" nextPath={nextPath} />
    </div>
  )
}
