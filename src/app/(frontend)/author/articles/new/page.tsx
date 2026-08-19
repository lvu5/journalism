import config from '@payload-config'
import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { getPayload } from 'payload'

import { ArticleSubmissionForm } from '@/components/ArticleSubmissionForm'
import { syncSupabaseAuthor } from '@/lib/author-identity'
import { getCurrentSupabaseUser } from '@/lib/auth'
import { getLocale } from '@/lib/get-locale'

export const dynamic = 'force-dynamic'

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getLocale()) === 'vi' ? 'Gửi bài' : 'Submit an article' }
}

export default async function NewArticlePage() {
  const locale = await getLocale()
  const supabaseUser = await getCurrentSupabaseUser()
  if (!supabaseUser) redirect('/login?next=/author/articles/new')
  const author = await syncSupabaseAuthor(supabaseUser)
  const payload = await getPayload({ config })
  const drafts = await payload.count({
    collection: 'articles',
    overrideAccess: false,
    user: author,
    where: {
      and: [{ submittedBy: { equals: author.id } }, { workflowStatus: { equals: 'draft' } }],
    },
  })
  const copy =
    locale === 'vi'
      ? {
          back: 'Khu vực tác giả',
          kicker: 'Bài viết mới',
          title: 'Viết và gửi bài',
          intro:
            'Lưu tối đa 10 bản nháp để tiếp tục sau, hoặc gửi bài hoàn chỉnh vào quy trình biên tập.',
        }
      : {
          back: 'Author area',
          kicker: 'New article',
          title: 'Write and submit',
          intro:
            'Save up to 10 drafts to continue later, or submit a completed article for editorial review.',
        }

  return (
    <div className="contribution-page shell">
      <Link className="back-link" href="/author">
        ← {copy.back}
      </Link>
      <header className="split-page-header">
        <div>
          <p className="section-kicker">{copy.kicker}</p>
          <h1>{copy.title}</h1>
        </div>
        <p>{copy.intro}</p>
      </header>
      <ArticleSubmissionForm draftCount={drafts.totalDocs} locale={locale} />
    </div>
  )
}
