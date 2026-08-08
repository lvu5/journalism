import Link from 'next/link'

import { caseStatusLabels, formatDate, statusLabels, type IncidentView } from '@/lib/content'
import type { Locale } from '@/lib/i18n'

export function IncidentCard({ incident, locale }: { incident: IncidentView; locale: Locale }) {
  const copy = locale === 'vi'
    ? { notable: 'Vì sao đáng chú ý?', open: 'Mở hồ sơ', contribute: 'Đóng góp thông tin', sources: 'nguồn' }
    : { notable: 'Why is this notable?', open: 'Open case', contribute: 'Contribute information', sources: 'sources' }

  return (
    <article className="incident-card">
      <div className="incident-date">
        <time dateTime={incident.dateStart}>{formatDate(incident.dateStart, true, locale)}</time>
        {incident.dateEnd && (
          <span>
            → <time dateTime={incident.dateEnd}>{formatDate(incident.dateEnd, true, locale)}</time>
          </span>
        )}
      </div>
      <div>
        <div className="incident-status-row">
          <span className={`case-status case-status-${incident.caseStatus}`}>
            {caseStatusLabels[locale][incident.caseStatus]}
          </span>
          <span className={`status status-${incident.status}`}>{statusLabels[locale][incident.status]}</span>
          {incident.location && <span>{incident.location}</span>}
        </div>
        <h3><Link href={`/incidents/${incident.slug}`}>{incident.title}</Link></h3>
        <p>{incident.summary}</p>
        <details>
          <summary>{copy.notable}</summary>
          <p>{incident.notabilityReason}</p>
        </details>
        <div className="incident-actions">
          <Link href={`/incidents/${incident.slug}`}>{copy.open} →</Link>
          {incident.crowdsourcingEnabled && incident.caseStatus !== 'closed' && (
            <Link href={`/incidents/${incident.slug}/contribute`}>{copy.contribute} ↗</Link>
          )}
        </div>
      </div>
      <div className="source-count">
        <strong>{incident.citationCount}</strong>
        <span>{copy.sources}</span>
      </div>
    </article>
  )
}
