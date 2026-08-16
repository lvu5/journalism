import config from '@payload-config'
import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { getPayload } from 'payload'

import { syncSupabaseAuthor } from '@/lib/author-identity'
import { getCurrentSupabaseUser } from '@/lib/auth'
import { getLocale } from '@/lib/get-locale'

type AuthorPageProps = { searchParams: Promise<{ password?: string; submitted?: string }> }

export const dynamic = 'force-dynamic'

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getLocale()) === 'vi' ? 'Khu vực tác giả' : 'Author area' }
}

const workflowLabels = {
  vi: {
    draft: 'Bản nháp', submitted: 'Đã gửi', in_review: 'Đang duyệt',
    changes_requested: 'Cần chỉnh sửa', approved: 'Đã duyệt', published: 'Đã xuất bản', rejected: 'Từ chối',
  },
  en: {
    draft: 'Draft', submitted: 'Submitted', in_review: 'In review',
    changes_requested: 'Changes requested', approved: 'Approved', published: 'Published', rejected: 'Rejected',
  },
} as const

export default async function AuthorPage({ searchParams }: AuthorPageProps) {
  const locale = await getLocale()
  const supabaseUser = await getCurrentSupabaseUser()
  if (!supabaseUser) redirect('/login?next=/author')

  const author = await syncSupabaseAuthor(supabaseUser)
  const payload = await getPayload({ config })
  const submissions = await payload.find({
    collection: 'articles',
    depth: 0,
    limit: 25,
    overrideAccess: false,
    sort: '-updatedAt',
    user: author,
    where: { submittedBy: { equals: author.id } },
  })
  const params = await searchParams
  const copy = locale === 'vi'
    ? {
        kicker: 'Tài khoản tác giả', title: `Xin chào, ${author.publicName}`,
        intro: 'Gửi bài để ban biên tập xem xét. Chỉ quản trị viên mới có thể xuất bản.',
        newArticle: 'Gửi bài mới', submissions: 'Bài của bạn', empty: 'Bạn chưa gửi bài nào.',
        submitted: 'Bài đã được gửi để xem xét.', password: 'Mật khẩu đã được cập nhật.', updated: 'Cập nhật',
      }
    : {
        kicker: 'Author account', title: `Hello, ${author.publicName}`,
        intro: 'Submit reporting for editorial review. Only an administrator can publish it.',
        newArticle: 'Submit a new article', submissions: 'Your submissions', empty: 'You have not submitted an article yet.',
        submitted: 'Your article was submitted for review.', password: 'Your password was updated.', updated: 'Updated',
      }

  return (
    <div className="author-page shell">
      <header className="author-header">
        <div>
          <p className="section-kicker">{copy.kicker}</p>
          <h1>{copy.title}</h1>
          <p>{copy.intro}</p>
        </div>
        <Link className="primary-button" href="/author/articles/new">{copy.newArticle} <span aria-hidden="true">→</span></Link>
      </header>

      {params.submitted === '1' && <p className="form-message form-message-success" role="status">{copy.submitted}</p>}
      {params.password === 'updated' && <p className="form-message form-message-success" role="status">{copy.password}</p>}

      <section className="author-submissions" aria-labelledby="author-submissions-title">
        <h2 id="author-submissions-title">{copy.submissions}</h2>
        {submissions.docs.length ? (
          <ol>
            {submissions.docs.map((article) => (
              <li key={article.id}>
                <div>
                  <strong>{article.title}</strong>
                  <small>{copy.updated} {new Intl.DateTimeFormat(locale === 'vi' ? 'vi-VN' : 'en-US', { dateStyle: 'medium' }).format(new Date(article.updatedAt))}</small>
                </div>
                <span>{workflowLabels[locale][article.workflowStatus || 'draft']}</span>
              </li>
            ))}
          </ol>
        ) : <p className="empty-state">{copy.empty}</p>}
      </section>
    </div>
  )
}
