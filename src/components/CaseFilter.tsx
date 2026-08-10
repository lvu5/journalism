import Link from 'next/link'

import { IncidentCard } from './IncidentCard'
import { Pagination } from './Pagination'
import {
  caseStatusDescriptions,
  caseStatusLabels,
  type IncidentView,
} from '@/lib/content'
import type { Locale } from '@/lib/i18n'

export type CaseStatusFilter = IncidentView['caseStatus'] | 'all'

type CaseFilterProps = {
  activeStatus: CaseStatusFilter
  counts: Record<IncidentView['caseStatus'], number>
  incidents: IncidentView[]
  locale: Locale
  page: number
  totalDocs: number
  totalPages: number
}

// Server-side filtering and pagination via search params: links make every
// filtered view shareable and crawlable, and keep headings out of <button>s.
export function CaseFilter({
  activeStatus,
  counts,
  incidents,
  locale,
  page,
  totalDocs,
  totalPages,
}: CaseFilterProps) {
  const lifecycle = Object.keys(caseStatusLabels[locale]) as IncidentView['caseStatus'][]
  const copy = locale === 'vi'
    ? {
        lifecycle: 'Vòng đời hồ sơ',
        publicStates: '5 trạng thái công khai',
        cases: 'hồ sơ',
        all: 'Tất cả',
        clear: 'Bỏ lọc',
        filterBy: 'Lọc theo',
        empty: 'Không có hồ sơ ở trạng thái này.',
      }
    : {
        lifecycle: 'Case lifecycle',
        publicStates: '5 public states',
        cases: 'cases',
        all: 'All cases',
        clear: 'Clear filter',
        filterBy: 'Filter by',
        empty: 'There are no cases with this status.',
      }

  const hrefForStatus = (status: CaseStatusFilter, pageNumber = 1) => {
    const params = new URLSearchParams()
    if (status !== 'all') params.set('status', status)
    if (pageNumber > 1) params.set('page', String(pageNumber))
    const query = params.toString()
    return query ? `/incidents?${query}` : '/incidents'
  }

  return (
    <>
      <section className="case-lifecycle" aria-labelledby="case-lifecycle-heading">
        <div className="section-heading">
          <div>
            <h2 id="case-lifecycle-heading">{copy.lifecycle}</h2>
            <span>{copy.publicStates}</span>
          </div>
          <div className="case-filter-controls">
            <span aria-live="polite">{totalDocs} {copy.cases}</span>
            <Link
              aria-current={activeStatus === 'all' ? 'page' : undefined}
              className="case-filter-reset"
              href="/incidents"
            >
              {activeStatus === 'all' ? copy.all : copy.clear}
            </Link>
          </div>
        </div>
        <div className="case-lifecycle-grid">
          {lifecycle.map((caseStatus, index) => {
            const isActive = activeStatus === caseStatus

            return (
              <Link
                aria-current={isActive ? 'page' : undefined}
                aria-label={`${copy.filterBy} ${caseStatusLabels[locale][caseStatus]}`}
                className={`case-filter-option${isActive ? ' is-active' : ''}`}
                href={hrefForStatus(caseStatus)}
                key={caseStatus}
              >
                <span>{String(index + 1).padStart(2, '0')}</span>
                <div>
                  <h3>{caseStatusLabels[locale][caseStatus]}</h3>
                  <p>{caseStatusDescriptions[locale][caseStatus]}</p>
                  <strong>{counts[caseStatus] ?? 0} {copy.cases}</strong>
                </div>
              </Link>
            )
          })}
        </div>
      </section>

      <div className="incident-list">
        {incidents.length ? (
          incidents.map((incident) => (
            <IncidentCard incident={incident} key={incident.id} locale={locale} />
          ))
        ) : (
          <p className="case-filter-empty">{copy.empty}</p>
        )}
      </div>
      <Pagination
        hrefForPage={(pageNumber) => hrefForStatus(activeStatus, pageNumber)}
        locale={locale}
        page={page}
        totalPages={totalPages}
      />
    </>
  )
}
