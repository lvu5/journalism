import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'

import {
  caseStatusDescriptions,
  caseStatusLabels,
  contributionTypeLabels,
  formatDate,
  statusLabels,
} from '@/lib/content'
import { getLocale } from '@/lib/get-locale'
import { getIncidentBySlug } from '@/lib/queries'

type CasePageProps = { params: Promise<{ slug: string }> }

export const dynamic = 'force-dynamic'

export async function generateMetadata({ params }: CasePageProps): Promise<Metadata> {
  const locale = await getLocale()
  const { slug } = await params
  const incident = await getIncidentBySlug(slug)
  return incident
    ? { title: incident.title, description: incident.summary }
    : { title: locale === 'vi' ? 'Không tìm thấy hồ sơ' : 'Case not found' }
}

export default async function CasePage({ params }: CasePageProps) {
  const locale = await getLocale()
  const copy = locale === 'vi' ? {
    back: 'Trở lại danh sách hồ sơ', demo: 'Hồ sơ minh họa — không phải sự kiện có thật.', tracking: 'Bắt đầu theo dõi',
    location: 'Địa điểm', undisclosed: 'Chưa công bố', sources: 'Nguồn', approvedCount: 'Đóng góp đã duyệt',
    caseStatus: 'Trạng thái hồ sơ', contribute: 'Đóng góp thông tin', editorialNote: 'Ghi chú biên tập', notable: 'Vì sao đáng chú ý?',
    principle: 'Nguyên tắc', principleItems: ['Đáng chú ý không đồng nghĩa với kết luận sai phạm.', 'Thông tin cộng đồng chỉ xuất hiện sau khi được xem xét và xác minh.'],
    approved: 'Đóng góp đã duyệt', items: 'mục', anonymous: 'Ẩn danh', viewSource: 'Xem nguồn', empty: 'Chưa có đóng góp cộng đồng nào được duyệt để công bố.',
    accessed: 'Truy cập', original: 'Nguồn gốc', archive: 'Bản lưu',
  } : {
    back: 'Back to cases', demo: 'Demonstration case — not a real event.', tracking: 'Tracking started',
    location: 'Location', undisclosed: 'Not disclosed', sources: 'Sources', approvedCount: 'Approved contributions',
    caseStatus: 'Case status', contribute: 'Contribute information', editorialNote: 'Editorial note', notable: 'Why is this notable?',
    principle: 'Principle', principleItems: ['Notable does not mean wrongdoing has been established.', 'Community information appears only after editorial review and verification.'],
    approved: 'Approved contributions', items: 'items', anonymous: 'Anonymous', viewSource: 'View source', empty: 'No community contributions have been approved for publication yet.',
    accessed: 'Accessed', original: 'Original source', archive: 'Archive',
  }
  const { slug } = await params
  const incident = await getIncidentBySlug(slug)
  if (!incident) notFound()

  const acceptsContributions = incident.crowdsourcingEnabled && incident.caseStatus !== 'closed'

  return (
    <article className="case-page">
      <header className="case-header shell">
        <Link className="back-link" href="/incidents">← {copy.back}</Link>
        {incident.isDemo && <p className="inline-demo-note">{copy.demo}</p>}
        <div className="case-badges">
          <span className={`case-status case-status-${incident.caseStatus}`}>
            {caseStatusLabels[locale][incident.caseStatus]}
          </span>
          <span className={`status status-${incident.status}`}>{statusLabels[locale][incident.status]}</span>
        </div>
        <h1>{incident.title}</h1>
        <p className="case-summary">{incident.summary}</p>
        <div className="case-meta">
          <div><span>{copy.tracking}</span><strong>{formatDate(incident.dateStart, true, locale)}</strong></div>
          <div><span>{copy.location}</span><strong>{incident.location || copy.undisclosed}</strong></div>
          <div><span>{copy.sources}</span><strong>{incident.citationCount}</strong></div>
          <div><span>{copy.approvedCount}</span><strong>{incident.approvedContributions.length}</strong></div>
        </div>
      </header>

      <div className="case-body shell">
        <aside className="case-status-panel">
          <p>{copy.caseStatus}</p>
          <h2>{caseStatusLabels[locale][incident.caseStatus]}</h2>
          <span>{caseStatusDescriptions[locale][incident.caseStatus]}</span>
          {acceptsContributions && (
            <Link className="primary-button" href={`/incidents/${incident.slug}/contribute`}>
              <span>{copy.contribute}</span><span aria-hidden="true">→</span>
            </Link>
          )}
        </aside>
        <section className="case-notability" aria-labelledby="notability-heading">
          <p className="section-kicker">{copy.editorialNote}</p>
          <h2 id="notability-heading">{copy.notable}</h2>
          <p>{incident.notabilityReason}</p>
          <div className="case-safeguard">
            <strong>{copy.principle}</strong>
            {copy.principleItems.map((item) => <span key={item}>{item}</span>)}
          </div>
        </section>
      </div>

      <section className="community-evidence shell" aria-labelledby="community-evidence-heading">
        <div className="section-heading section-heading-large">
          <h2 id="community-evidence-heading">{copy.approved}</h2>
          <span>{incident.approvedContributions.length} {copy.items}</span>
        </div>
        {incident.approvedContributions.length ? (
          <div className="community-evidence-list">
            {incident.approvedContributions.map((contribution) => (
              <article className="community-contribution" key={contribution.id}>
                <p>{contributionTypeLabels[locale][contribution.contributionType]}</p>
                <h3>{contribution.title}</h3>
                <div>{contribution.description}</div>
                <footer>
                  <span>{contribution.contributorName || copy.anonymous}</span>
                  {contribution.sourceUrl && (
                    <a href={contribution.sourceUrl} rel="noreferrer noopener" target="_blank">{copy.viewSource} ↗</a>
                  )}
                </footer>
              </article>
            ))}
          </div>
        ) : (
          <p className="empty-evidence">{copy.empty}</p>
        )}
      </section>

      <section className="citations shell" aria-labelledby="case-citations-heading">
        <div className="section-heading section-heading-large">
          <h2 id="case-citations-heading">{copy.sources}</h2>
          <span>{incident.citations.length} {copy.items}</span>
        </div>
        <ol>
          {incident.citations.map((citation, index) => (
            <li key={`${citation.url}-${index}`}>
              <span>{String(index + 1).padStart(2, '0')}</span>
              <div>
                <h3>{citation.sourceTitle}</h3>
                <p>{copy.accessed} {formatDate(citation.accessedAt, true, locale)}</p>
              </div>
              <div className="citation-links">
                <a href={citation.url} rel="noreferrer noopener" target="_blank">{copy.original} ↗</a>
                {citation.archiveUrl && (
                  <a href={citation.archiveUrl} rel="noreferrer noopener" target="_blank">{copy.archive} ↗</a>
                )}
              </div>
            </li>
          ))}
        </ol>
      </section>
    </article>
  )
}
