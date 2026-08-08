import Link from 'next/link'

import { formatDate, topicLabels, type ArticleView } from '@/lib/content'
import type { Locale } from '@/lib/i18n'

export function ArticleCard({ article, index, locale }: { article: ArticleView; index: number; locale: Locale }) {
  const copy = locale === 'vi'
    ? { investigation: 'Điều tra', editorial: 'Ban biên tập', sources: 'nguồn' }
    : { investigation: 'Investigation', editorial: 'Editorial team', sources: 'sources' }

  return (
    <article className="article-card">
      <div className="card-index">{String(index + 1).padStart(2, '0')}</div>
      <div className="card-content">
        <div className="eyebrow-row">
          <span>{article.topics[0] ? topicLabels[locale][article.topics[0]] : copy.investigation}</span>
          <time dateTime={article.publishedAt}>{formatDate(article.publishedAt, true, locale)}</time>
        </div>
        <h3>
          <Link href={`/articles/${article.slug}`}>{article.title}</Link>
        </h3>
        <p>{article.summary}</p>
        <div className="card-meta">
          <span>{article.byline.length ? article.byline.join(', ') : copy.editorial}</span>
          <span>{article.citations.length} {copy.sources}</span>
        </div>
      </div>
    </article>
  )
}
