import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'

import { ContributionForm } from '@/components/ContributionForm'
import { caseStatusLabels } from '@/lib/content'
import { getLocale } from '@/lib/get-locale'
import { getIncidentBySlug } from '@/lib/queries'

type ContributePageProps = { params: Promise<{ slug: string }> }

export const dynamic = 'force-dynamic'

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getLocale()) === 'vi' ? 'Đóng góp thông tin cho hồ sơ' : 'Contribute to a case' }
}

export default async function ContributePage({ params }: ContributePageProps) {
  const locale = await getLocale()
  const copy = locale === 'vi' ? {
    back: 'Trở lại hồ sơ', desk: 'Bàn tin cộng đồng', title: 'Gửi thông tin', after: 'Điều gì xảy ra sau khi gửi?',
    steps: ['Thông tin được tiếp nhận riêng tư.', 'Người duyệt sàng lọc nguồn và liên hệ nếu cần.', 'Chỉ phần đã xác minh và được duyệt mới xuất hiện trong hồ sơ.'],
    warning: 'Không gửi mật khẩu, dữ liệu đăng nhập hoặc tài liệu có thể gây nguy hiểm cho bạn.', closed: 'Hồ sơ này hiện không nhận thêm đóng góp.',
    closedDetail: 'Bạn vẫn có thể xem các nguồn và đóng góp đã được duyệt trên trang hồ sơ.', view: 'Xem hồ sơ',
  } : {
    back: 'Back to case', desk: 'Community desk', title: 'Submit information', after: 'What happens after submission?',
    steps: ['Your information is received privately.', 'A reviewer screens the sources and contacts you if needed.', 'Only verified and approved information appears on the case page.'],
    warning: 'Do not submit passwords, login details, or documents that could put you at risk.', closed: 'This case is not accepting new contributions.',
    closedDetail: 'You can still view sources and approved contributions on the case page.', view: 'View case',
  }
  const { slug } = await params
  const incident = await getIncidentBySlug(slug)
  if (!incident) notFound()

  const acceptsContributions = incident.crowdsourcingEnabled && incident.caseStatus !== 'closed'

  return (
    <div className="contribution-page shell">
      <header className="contribution-header">
        <Link className="back-link" href={`/incidents/${incident.slug}`}>← {copy.back}</Link>
        <p className="section-kicker">{copy.desk}</p>
        <h1>{copy.title}</h1>
        <p>{incident.title}</p>
        <span className={`case-status case-status-${incident.caseStatus}`}>
          {caseStatusLabels[locale][incident.caseStatus]}
        </span>
      </header>

      {acceptsContributions ? (
        <div className="contribution-layout">
          <aside>
            <h2>{copy.after}</h2>
            <ol>
              {copy.steps.map((step, index) => (
                <li key={step}><strong>0{index + 1}</strong><span>{step}</span></li>
              ))}
            </ol>
            <p>{copy.warning}</p>
          </aside>
          <ContributionForm incidentSlug={incident.slug} locale={locale} />
        </div>
      ) : (
        <section className="contribution-closed">
          <h2>{copy.closed}</h2>
          <p>{copy.closedDetail}</p>
          <Link className="outline-link" href={`/incidents/${incident.slug}`}>{copy.view}</Link>
        </section>
      )}
    </div>
  )
}
