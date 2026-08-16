import type { Metadata } from 'next'

import { Timeline } from '@/components/Timeline'
import { getLocale } from '@/lib/get-locale'
import { getIncidents } from '@/lib/queries'

export async function generateMetadata(): Promise<Metadata> {
  const title = (await getLocale()) === 'vi' ? 'Hồ sơ theo năm' : 'Cases by year'
  return { title, alternates: { canonical: '/timeline' }, openGraph: { title } }
}
export const dynamic = 'force-dynamic'

export default async function TimelinePage() {
  const locale = await getLocale()
  const incidents = await getIncidents()

  return (
    <div className="timeline-page">
      <section className="timeline-shell shell" aria-label={locale === 'vi' ? 'Các hồ sơ theo thời gian' : 'Cases over time'}>
        <Timeline incidents={incidents} locale={locale} />
      </section>
    </div>
  )
}
