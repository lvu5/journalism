import type { Metadata } from 'next'

import { ArticleCard } from '@/components/ArticleCard'
import { getLocale } from '@/lib/get-locale'
import { getArticles } from '@/lib/queries'

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getLocale()) === 'vi' ? 'Mới nhất' : 'Recent' }
}
export const dynamic = 'force-dynamic'

export default async function RecentPage() {
  const locale = await getLocale()
  const articles = await getArticles(30)

  return (
    <div className="listing-page shell">
      {articles.some((article) => article.isDemo) && (
        <p className="inline-demo-note">
          {locale === 'vi' ? 'Dữ liệu minh họa cho bản MVP — không phải tin thực tế.' : 'MVP demonstration content — not reporting about real events.'}
        </p>
      )}
      <div className="article-list listing-articles">
        {articles.map((article, index) => (
          <ArticleCard article={article} index={index} key={article.id} locale={locale} />
        ))}
      </div>
    </div>
  )
}
