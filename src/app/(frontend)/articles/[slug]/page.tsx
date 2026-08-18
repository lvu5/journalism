import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import ReactMarkdown from 'react-markdown'
import rehypeSanitize from 'rehype-sanitize'
import remarkGfm from 'remark-gfm'

import { citationAnchor, renderCitationReferences } from '@/lib/citations'
import { formatDate, topicLabels } from '@/lib/content'
import { getLocale } from '@/lib/get-locale'
import { getArticleBySlug } from '@/lib/queries'

type ArticlePageProps = { params: Promise<{ slug: string }> }

export const dynamic = 'force-dynamic'

export async function generateMetadata({ params }: ArticlePageProps): Promise<Metadata> {
  const locale = await getLocale()
  const { slug } = await params
  const article = await getArticleBySlug(slug)
  return article
    ? {
        title: article.title,
        description: article.summary,
        alternates: { canonical: `/articles/${article.slug}` },
        openGraph: { title: article.title, description: article.summary, type: 'article' },
      }
    : { title: locale === 'vi' ? 'Không tìm thấy bài' : 'Article not found' }
}

export default async function ArticlePage({ params }: ArticlePageProps) {
  const locale = await getLocale()
  const copy =
    locale === 'vi'
      ? {
          back: 'Trở lại bài mới',
          author: 'Tác giả',
          editorial: 'Ban biên tập',
          eventDate: 'Ngày sự kiện',
          published: 'Xuất bản',
          sources: 'Nguồn',
          commitment: 'Cam kết biên tập',
          commitments: [
            'Nguyên văn tài liệu được ưu tiên.',
            'Khoảng trống dữ liệu được ghi rõ.',
            'Thay đổi sau xuất bản được lưu vết.',
          ],
          citations: 'Nguồn & tài liệu',
          items: 'mục',
          accessed: 'Truy cập',
          original: 'Nguồn gốc',
          archive: 'Bản lưu',
          corrections: 'Đính chính',
        }
      : {
          back: 'Back to recent',
          author: 'Author',
          editorial: 'Editorial team',
          eventDate: 'Event date',
          published: 'Published',
          sources: 'Sources',
          commitment: 'Editorial commitment',
          commitments: [
            'Primary documents are preferred.',
            'Data gaps are clearly stated.',
            'Post-publication changes are recorded.',
          ],
          citations: 'Sources & documents',
          items: 'items',
          accessed: 'Accessed',
          original: 'Original source',
          archive: 'Archive',
          corrections: 'Corrections',
        }
  const { slug } = await params
  const article = await getArticleBySlug(slug)
  if (!article) notFound()

  return (
    <article className="story-page">
      <header className="story-header shell">
        <Link className="back-link" href="/recent">
          ← {copy.back}
        </Link>
        <div className="story-taxonomy">
          {article.topics.map((topic) => (
            <span key={topic}>{topicLabels[locale][topic] || topic}</span>
          ))}
        </div>
        <h1>{article.title}</h1>
        <p className="story-summary">{article.summary}</p>
        <div className="story-byline">
          <div>
            <span>{copy.author}</span>
            <strong>{article.byline.length ? article.byline.join(', ') : copy.editorial}</strong>
          </div>
          <div>
            <span>{copy.eventDate}</span>
            <strong>{formatDate(article.eventDate, true, locale)}</strong>
          </div>
          <div>
            <span>{copy.published}</span>
            <strong>{formatDate(article.publishedAt, true, locale)}</strong>
          </div>
          <div>
            <span>{copy.sources}</span>
            <strong>{article.citations.length}</strong>
          </div>
        </div>
      </header>

      <div className="story-layout shell">
        <aside className="story-rail">
          <p>{copy.commitment}</p>
          {copy.commitments.map((commitment) => (
            <span key={commitment}>{commitment}</span>
          ))}
        </aside>
        <div className="markdown-body">
          <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeSanitize]}>
            {renderCitationReferences(article.bodyMarkdown, article.citations)}
          </ReactMarkdown>
        </div>
      </div>

      {article.corrections.length > 0 && (
        <section className="corrections shell" aria-labelledby="corrections-heading">
          <h2 id="corrections-heading">{copy.corrections}</h2>
          <ol>
            {article.corrections.map((correction) => (
              <li key={correction.issuedAt}>
                <time dateTime={correction.issuedAt}>
                  {formatDate(correction.issuedAt, true, locale)}
                </time>
                <p>{correction.note}</p>
              </li>
            ))}
          </ol>
        </section>
      )}

      <section className="citations shell" aria-labelledby="citations-heading">
        <div className="section-heading section-heading-large">
          <h2 id="citations-heading">{copy.citations}</h2>
          <span>
            {article.citations.length} {copy.items}
          </span>
        </div>
        <ol>
          {article.citations.map((citation, index) => (
            <li
              id={citationAnchor(citation.citationKey || `source-${index + 1}`)}
              key={`${citation.url}-${index}`}
            >
              <span>{String(index + 1).padStart(2, '0')}</span>
              <div>
                <h3>{citation.sourceTitle}</h3>
                <p>
                  {[
                    citation.publisher,
                    `${copy.accessed} ${formatDate(citation.accessedAt, true, locale)}`,
                  ]
                    .filter(Boolean)
                    .join(' · ')}
                </p>
                {citation.note && <p className="citation-note">{citation.note}</p>}
              </div>
              <div className="citation-links">
                <a href={citation.url} rel="noreferrer noopener" target="_blank">
                  {copy.original} ↗
                </a>
                {citation.archiveUrl && (
                  <a href={citation.archiveUrl} rel="noreferrer noopener" target="_blank">
                    {copy.archive} ↗
                  </a>
                )}
              </div>
            </li>
          ))}
        </ol>
      </section>
    </article>
  )
}
