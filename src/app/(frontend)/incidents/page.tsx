import type { Metadata } from 'next'

import { CaseFilter } from '@/components/CaseFilter'
import { getLocale } from '@/lib/get-locale'
import { getIncidents } from '@/lib/queries'

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getLocale()) === 'vi' ? 'Hồ sơ' : 'Cases' }
}
export const dynamic = 'force-dynamic'

export default async function IncidentsPage() {
  const locale = await getLocale()
  const incidents = await getIncidents()

  return (
    <div className="listing-page shell">
      {incidents.some((incident) => incident.isDemo) && (
        <p className="inline-demo-note">
          {locale === 'vi' ? 'Dữ liệu minh họa cho bản MVP — không phải sự kiện có thật.' : 'MVP demonstration data — not real cases.'}
        </p>
      )}
      <CaseFilter incidents={incidents} locale={locale} />
    </div>
  )
}
