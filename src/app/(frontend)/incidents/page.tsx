import type { Metadata } from 'next'

import { CaseFilter, type CaseStatusFilter } from '@/components/CaseFilter'
import { caseStatusLabels, type IncidentView } from '@/lib/content'
import { getLocale } from '@/lib/get-locale'
import { getIncidentsPage, getIncidentStatusCounts } from '@/lib/queries'

export async function generateMetadata(): Promise<Metadata> {
  const title = (await getLocale()) === 'vi' ? 'Hồ sơ' : 'Cases'
  return { title, alternates: { canonical: '/incidents' }, openGraph: { title } }
}
export const dynamic = 'force-dynamic'

const PAGE_SIZE = 12
const VALID_STATUSES = Object.keys(caseStatusLabels.vi) as IncidentView['caseStatus'][]

type IncidentsPageProps = { searchParams: Promise<{ page?: string; status?: string }> }

export default async function IncidentsPage({ searchParams }: IncidentsPageProps) {
  const locale = await getLocale()
  const { page: rawPage, status: rawStatus } = await searchParams
  const requestedPage = Math.max(1, Number.parseInt(rawPage ?? '1', 10) || 1)
  const activeStatus: CaseStatusFilter = VALID_STATUSES.includes(
    rawStatus as IncidentView['caseStatus'],
  )
    ? (rawStatus as IncidentView['caseStatus'])
    : 'all'

  const [{ items, page, totalDocs, totalPages }, counts] = await Promise.all([
    getIncidentsPage(
      requestedPage,
      PAGE_SIZE,
      activeStatus === 'all' ? undefined : activeStatus,
    ),
    getIncidentStatusCounts(),
  ])

  return (
    <div className="listing-page shell">
      {items.some((incident) => incident.isDemo) && (
        <p className="inline-demo-note">
          {locale === 'vi' ? 'Dữ liệu minh họa cho bản MVP — không phải sự kiện có thật.' : 'MVP demonstration data — not real cases.'}
        </p>
      )}
      <CaseFilter
        activeStatus={activeStatus}
        counts={counts}
        incidents={items}
        locale={locale}
        page={page}
        totalDocs={totalDocs}
        totalPages={totalPages}
      />
    </div>
  )
}
