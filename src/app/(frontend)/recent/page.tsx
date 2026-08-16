import type { Metadata } from 'next'

import { ArticleCard } from '@/components/ArticleCard'
import { Pagination } from '@/components/Pagination'
import { getLocale } from '@/lib/get-locale'
import { getArticlesPage } from '@/lib/queries'

export async function generateMetadata(): Promise<Metadata> {
  const title = (await getLocale()) === 'vi' ? 'Mới nhất' : 'Recent'
  return { title, alternates: { canonical: '/recent' }, openGraph: { title } }
}
export const dynamic = 'force-dynamic'

const PAGE_SIZE = 12

type RecentPageProps = { searchParams: Promise<{ page?: string }> }

export default async function RecentPage({ searchParams }: RecentPageProps) {
  const locale = await getLocale()
  const { page: rawPage } = await searchParams
  const requestedPage = Math.max(1, Number.parseInt(rawPage ?? '1', 10) || 1)
  const { items, page, totalPages } = await getArticlesPage(requestedPage, PAGE_SIZE)

  return (
    <div className="listing-page shell">
      <div className="article-list listing-articles">
        {items.map((article, index) => (
          <ArticleCard article={article} index={index} key={article.id} locale={locale} />
        ))}
      </div>
      <Pagination
        hrefForPage={(pageNumber) => (pageNumber > 1 ? `/recent?page=${pageNumber}` : '/recent')}
        locale={locale}
        page={page}
        totalPages={totalPages}
      />
    </div>
  )
}
