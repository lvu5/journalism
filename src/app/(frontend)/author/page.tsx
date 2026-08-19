import config from '@payload-config'
import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { getPayload } from 'payload'

import { syncSupabaseAuthor } from '@/lib/author-identity'
import { MAX_SAVED_ARTICLE_DRAFTS } from '@/lib/article-submission-state'
import { getCurrentSupabaseUser } from '@/lib/auth'
import { getLocale } from '@/lib/get-locale'

type AuthorPageProps = {
  searchParams: Promise<{ draft?: string; password?: string; submitted?: string }>
}

export const dynamic = 'force-dynamic'

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getLocale()) === 'vi' ? 'Khu vực tác giả' : 'Author area' }
}

const workflowLabels = {
  vi: {
    draft: 'Bản nháp',
    submitted: 'Đã gửi',
    in_review: 'Đang duyệt',
    changes_requested: 'Cần chỉnh sửa',
    approved: 'Đã duyệt',
    published: 'Đã xuất bản',
    rejected: 'Từ chối',
  },
  en: {
    draft: 'Draft',
    submitted: 'Submitted',
    in_review: 'In review',
    changes_requested: 'Changes requested',
    approved: 'Approved',
    published: 'Published',
    rejected: 'Rejected',
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
  const drafts = await payload.count({
    collection: 'articles',
    overrideAccess: false,
    user: author,
    where: {
      and: [{ submittedBy: { equals: author.id } }, { workflowStatus: { equals: 'draft' } }],
    },
  })
  const params = await searchParams
  const copy =
    locale === 'vi'
      ? {
          kicker: 'Tài khoản tác giả',
          title: `Xin chào, ${author.publicName}`,
          intro: 'Gửi bài để ban biên tập xem xét. Chỉ quản trị viên mới có thể xuất bản.',
          newArticle: 'Gửi bài mới',
          submissions: 'Bài của bạn',
          empty: 'Bạn chưa gửi bài nào.',
          submitted: 'Bài đã được gửi để xem xét.',
          draftSaved: 'Bản nháp đã được lưu.',
          password: 'Mật khẩu đã được cập nhật.',
          updated: 'Cập nhật',
          drafts: 'Bản nháp',
          continueDraft: 'Tiếp tục bản nháp',
        }
      : {
          kicker: 'Author account',
          title: `Hello, ${author.publicName}`,
          intro: 'Submit reporting for editorial review. Only an administrator can publish it.',
          newArticle: 'Submit a new article',
          submissions: 'Your submissions',
          empty: 'You have not submitted an article yet.',
          submitted: 'Your article was submitted for review.',
          draftSaved: 'Your draft was saved.',
          password: 'Your password was updated.',
          updated: 'Updated',
          drafts: 'Drafts',
          continueDraft: 'Continue draft',
        }

  return (
    <div className="author-page shell">
      <header className="author-header">
        <div>
          <p className="section-kicker">{copy.kicker}</p>
          <h1>{copy.title}</h1>
          <p>{copy.intro}</p>
        </div>
        <Link className="primary-button" href="/author/articles/new">
          {copy.newArticle} <span aria-hidden="true">→</span>
        </Link>
      </header>

      {params.submitted === '1' && (
        <p className="form-message form-message-success" role="status">
          {copy.submitted}
        </p>
      )}
      {params.draft === 'saved' && (
        <p className="form-message form-message-success" role="status">
          {copy.draftSaved}
        </p>
      )}
      {params.password === 'updated' && (
        <p className="form-message form-message-success" role="status">
          {copy.password}
        </p>
      )}

      <section className="author-submissions" aria-labelledby="author-submissions-title">
        <div className="author-submissions-heading">
          <h2 id="author-submissions-title">{copy.submissions}</h2>
          <span>
            {copy.drafts} {drafts.totalDocs}/{MAX_SAVED_ARTICLE_DRAFTS}
          </span>
        </div>
        {submissions.docs.length ? (
          <ol>
            {submissions.docs.map((article) => (
              <li key={article.id}>
                <div>
                  {article.workflowStatus === 'draft' ? (
                    <Link
                      className="article-draft-link"
                      href={`/author/articles/${article.id}/edit`}
                    >
                      {article.title}
                      <small>{copy.continueDraft} →</small>
                    </Link>
                  ) : (
                    <strong>{article.title}</strong>
                  )}
                  <small>
                    {copy.updated}{' '}
                    {new Intl.DateTimeFormat(locale === 'vi' ? 'vi-VN' : 'en-US', {
                      dateStyle: 'medium',
                    }).format(new Date(article.updatedAt))}
                  </small>
                </div>
                <span>{workflowLabels[locale][article.workflowStatus || 'draft']}</span>
              </li>
            ))}
          </ol>
        ) : (
          <p className="empty-state">{copy.empty}</p>
        )}
      </section>
    </div>
  )
}
