import Link from 'next/link'

import { caseStatusLabels, formatDate, type IncidentView } from '@/lib/content'
import type { Locale } from '@/lib/i18n'

export function Timeline({ incidents, locale }: { incidents: IncidentView[]; locale: Locale }) {
  const copy = locale === 'vi'
    ? { featured: 'Hồ sơ nổi bật', cases: 'hồ sơ', open: 'Xem hồ sơ', byYear: 'Danh sách theo năm' }
    : { featured: 'Featured cases', cases: 'cases', open: 'View case', byYear: 'Cases by year' }
  const ordered = [...incidents].sort(
    (first, second) => new Date(second.dateStart).getTime() - new Date(first.dateStart).getTime(),
  )
  const featuredCases = ordered.filter((incident) => incident.featured).slice(0, 3)
  const casesByYear = ordered.reduce<Record<string, IncidentView[]>>((groups, incident) => {
    const year = new Date(incident.dateStart).getFullYear().toString()
    groups[year] = [...(groups[year] || []), incident]
    return groups
  }, {})

  return (
    <>
      {featuredCases.length > 0 && (
        <section className="featured-cases" aria-labelledby="featured-cases-heading">
          <div className="simple-section-heading">
            <h2 id="featured-cases-heading">{copy.featured}</h2>
            <span>{featuredCases.length} {copy.cases}</span>
          </div>
          <div className="featured-case-grid">
            {featuredCases.map((incident) => (
              <article key={incident.id}>
                <div className="featured-case-meta">
                  <time dateTime={incident.dateStart}>{formatDate(incident.dateStart, true, locale)}</time>
                  <span className={`case-status case-status-${incident.caseStatus}`}>
                    {caseStatusLabels[locale][incident.caseStatus]}
                  </span>
                </div>
                <h3>
                  <Link href={`/incidents/${incident.slug}`}>{incident.title}</Link>
                </h3>
                <p>{incident.summary}</p>
                <Link className="simple-text-link" href={`/incidents/${incident.slug}`}>
                  {copy.open} →
                </Link>
              </article>
            ))}
          </div>
        </section>
      )}

      <section className="case-archive" aria-labelledby="case-archive-heading">
        <div className="simple-section-heading">
          <h2 id="case-archive-heading">{copy.byYear}</h2>
          <span>{ordered.length} {copy.cases}</span>
        </div>
        {Object.entries(casesByYear).map(([year, yearCases]) => (
          <section className="case-year" key={year} aria-labelledby={`year-${year}`}>
            <h3 id={`year-${year}`}>{year}</h3>
            <ol>
              {yearCases.map((incident) => (
                <li key={incident.id}>
                  <time dateTime={incident.dateStart}>{formatDate(incident.dateStart, false, locale)}</time>
                  <Link href={`/incidents/${incident.slug}`}>{incident.title}</Link>
                  <span className={`case-status case-status-${incident.caseStatus}`}>
                    {caseStatusLabels[locale][incident.caseStatus]}
                  </span>
                </li>
              ))}
            </ol>
          </section>
        ))}
      </section>
    </>
  )
}
