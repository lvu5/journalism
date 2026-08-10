import Link from 'next/link'

import type { Locale } from '@/lib/i18n'

type PaginationProps = {
  hrefForPage: (page: number) => string
  locale: Locale
  page: number
  totalPages: number
}

export function Pagination({ hrefForPage, locale, page, totalPages }: PaginationProps) {
  if (totalPages <= 1) return null

  const copy =
    locale === 'vi'
      ? { label: 'Phân trang', previous: 'Trang trước', next: 'Trang sau', page: 'Trang' }
      : { label: 'Pagination', previous: 'Previous', next: 'Next', page: 'Page' }

  return (
    <nav aria-label={copy.label} className="pagination">
      {page > 1 ? (
        <Link className="pagination-link" href={hrefForPage(page - 1)}>
          ← {copy.previous}
        </Link>
      ) : (
        <span aria-disabled="true" className="pagination-link is-disabled">
          ← {copy.previous}
        </span>
      )}
      <span className="pagination-status">
        {copy.page} {page} / {totalPages}
      </span>
      {page < totalPages ? (
        <Link className="pagination-link" href={hrefForPage(page + 1)}>
          {copy.next} →
        </Link>
      ) : (
        <span aria-disabled="true" className="pagination-link is-disabled">
          {copy.next} →
        </span>
      )}
    </nav>
  )
}
