import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'

import { ArticleSubmissionForm } from '@/components/ArticleSubmissionForm'
import { getCurrentUser } from '@/lib/auth'
import { getLocale } from '@/lib/get-locale'

export const dynamic = 'force-dynamic'

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getLocale()) === 'vi' ? 'Gửi bài' : 'Submit an article' }
}

export default async function NewArticlePage() {
  const locale = await getLocale()
  if (!await getCurrentUser()) redirect('/login?next=/author/articles/new')
  const copy = locale === 'vi'
    ? { back: 'Khu vực tác giả', kicker: 'Bài viết mới', title: 'Gửi bài để duyệt', intro: 'Bài sẽ ở trạng thái Đã gửi. Người duyệt có thể yêu cầu chỉnh sửa; chỉ quản trị viên mới được xuất bản.' }
    : { back: 'Author area', kicker: 'New article', title: 'Submit for review', intro: 'The article enters Submitted status. Reviewers may request changes; only administrators can publish.' }

  return (
    <div className="contribution-page shell">
      <Link className="back-link" href="/author">← {copy.back}</Link>
      <header className="split-page-header">
        <div><p className="section-kicker">{copy.kicker}</p><h1>{copy.title}</h1></div>
        <p>{copy.intro}</p>
      </header>
      <ArticleSubmissionForm locale={locale} />
    </div>
  )
}
