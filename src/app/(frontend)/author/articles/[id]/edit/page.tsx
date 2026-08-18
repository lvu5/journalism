import config from '@payload-config'
import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { getPayload } from 'payload'

import { ArticleSubmissionForm } from '@/components/ArticleSubmissionForm'
import { syncSupabaseAuthor } from '@/lib/author-identity'
import type { ArticleFormValue } from '@/lib/article-submission-state'
import { getCurrentSupabaseUser } from '@/lib/auth'
import { getLocale } from '@/lib/get-locale'
import type { Article } from '@/payload-types'

type EditDraftPageProps = {
  params: Promise<{ id: string }>
  searchParams: Promise<{ saved?: string }>
}

export const dynamic = 'force-dynamic'

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getLocale()) === 'vi' ? 'Chỉnh sửa bản nháp' : 'Edit draft' }
}

const relationID = (value: unknown): number | string | null => {
  if (typeof value === 'number' || typeof value === 'string') return value
  if (value && typeof value === 'object' && 'id' in value) {
    const id = value.id
    return typeof id === 'number' || typeof id === 'string' ? id : null
  }
  return null
}

export default async function EditDraftPage({ params, searchParams }: EditDraftPageProps) {
  const locale = await getLocale()
  const { id } = await params
  if (!/^\d+$/.test(id)) notFound()
  const supabaseUser = await getCurrentSupabaseUser()
  if (!supabaseUser) redirect(`/login?next=/author/articles/${id}/edit`)
  const author = await syncSupabaseAuthor(supabaseUser)
  const payload = await getPayload({ config })

  let article: Article
  try {
    article = await payload.findByID({
      collection: 'articles',
      id: Number(id),
      depth: 0,
      overrideAccess: false,
      user: author,
    })
  } catch {
    notFound()
  }
  if (
    article.workflowStatus !== 'draft' ||
    String(relationID(article.submittedBy)) !== String(author.id)
  ) {
    notFound()
  }

  const drafts = await payload.count({
    collection: 'articles',
    overrideAccess: false,
    user: author,
    where: {
      and: [{ submittedBy: { equals: author.id } }, { workflowStatus: { equals: 'draft' } }],
    },
  })
  const initialArticle: ArticleFormValue = {
    authors: article.byline?.map((byline) => byline.name).join(', ') || '',
    bodyMarkdown: article.bodyMarkdown,
    citations: article.citations,
    eventDate: article.eventDate,
    id: article.id,
    summary: article.summary,
    title: article.title,
  }
  const query = await searchParams
  const copy =
    locale === 'vi'
      ? {
          back: 'Khu vực tác giả',
          kicker: 'Bản nháp',
          title: 'Tiếp tục bài viết',
          intro: 'Lưu lại để tiếp tục sau, hoặc gửi bản hoàn chỉnh vào quy trình biên tập.',
          saved: 'Bản nháp đã được lưu.',
        }
      : {
          back: 'Author area',
          kicker: 'Draft',
          title: 'Continue writing',
          intro: 'Save your progress for later, or submit the completed article for review.',
          saved: 'Your draft was saved.',
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
      {query.saved === '1' && (
        <p className="form-message form-message-success" role="status">
          {copy.saved}
        </p>
      )}
      <ArticleSubmissionForm
        draftCount={drafts.totalDocs}
        initialArticle={initialArticle}
        locale={locale}
      />
    </div>
  )
}
