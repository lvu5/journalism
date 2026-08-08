import Link from 'next/link'

import { ArticleCard } from '@/components/ArticleCard'
import { IncidentCard } from '@/components/IncidentCard'
import { formatDate } from '@/lib/content'
import { getLocale } from '@/lib/get-locale'
import { getArticles, getIncidents } from '@/lib/queries'

export const dynamic = 'force-dynamic'

export default async function HomePage() {
  const locale = await getLocale()
  const copy = locale === 'vi' ? {
    demo: 'Nội dung bên dưới là dữ liệu minh họa, không phải sự kiện có thật.',
    kicker: 'Một tòa soạn mở cho những câu hỏi khó',
    headline1: 'Bằng chứng trước.',
    headline2: 'Kết luận sau.',
    intro: 'Chúng tôi tập hợp tài liệu, đối chiếu dữ liệu và trình bày rõ điều đã biết — cũng như điều vẫn cần được xác minh.',
    principles: 'Nguyên tắc xuất bản',
    principleItems: ['Mỗi khẳng định quan trọng đều có nguồn.', 'Người và tổ chức liên quan có quyền phản hồi.', 'Bản sửa đổi được lưu lại, không âm thầm xóa dấu vết.'],
    principlesLabel: 'Nguyên tắc biên tập',
    featured: 'Tiêu điểm',
    recordedSources: 'nguồn được ghi nhận',
    method: 'Phương pháp điều tra',
    read: 'Đọc bài và kiểm tra nguồn',
    sourceFile: 'Hồ sơ nguồn',
    documents: 'tài liệu / đường dẫn',
    updated: 'Cập nhật',
    latest: 'Mới nhất',
    viewAll: 'Xem toàn bộ',
    notable: 'Hồ sơ đáng chú ý',
    openIndex: 'Mở danh mục',
    statusNote: 'Trạng thái có thể thay đổi khi có tài liệu mới, phản hồi chính thức hoặc kết quả xác minh độc lập.',
    byYear: 'Xem theo năm',
    forAuthors: 'Dành cho tác giả',
    submitTitle: 'Có hồ sơ cần xem xét?',
    submitDescription: 'Gửi bản thảo bằng Markdown, đính kèm nguồn và theo dõi phản hồi của biên tập viên trong cùng một quy trình.',
    authorArea: 'Vào khu vực tác giả',
  } : {
    demo: 'The content below is demonstration data, not reporting about real events.',
    kicker: 'An open newsroom for difficult questions',
    headline1: 'Evidence first.',
    headline2: 'Conclusions later.',
    intro: 'We gather records, compare data, and clearly present what is known — and what still needs to be verified.',
    principles: 'Publishing principles',
    principleItems: ['Every material claim has a source.', 'People and organizations have a right of reply.', 'Corrections are recorded rather than silently erased.'],
    principlesLabel: 'Editorial principles',
    featured: 'Featured',
    recordedSources: 'recorded sources',
    method: 'Investigative method',
    read: 'Read and check the sources',
    sourceFile: 'Source file',
    documents: 'documents / links',
    updated: 'Updated',
    latest: 'Recent',
    viewAll: 'View all',
    notable: 'Notable case',
    openIndex: 'Open index',
    statusNote: 'Status may change when new records, official responses, or independent verification become available.',
    byYear: 'View by year',
    forAuthors: 'For authors',
    submitTitle: 'Have a story for review?',
    submitDescription: 'Submit a Markdown draft, attach sources, and follow editorial feedback in one workflow.',
    authorArea: 'Open author area',
  }
  const [articles, incidents] = await Promise.all([getArticles(6), getIncidents(4)])
  const lead = articles.find((article) => article.featured) || articles[0]
  const recent = articles.filter((article) => article.id !== lead.id).slice(0, 4)
  const featuredIncident = incidents.find((incident) => incident.featured) || incidents[0]
  const isDemo = articles.some((article) => article.isDemo) || incidents.some((incident) => incident.isDemo)

  return (
    <>
      {isDemo && (
        <div className="demo-notice" role="note">
          <div className="shell">
            <strong>Bản MVP</strong>
            <span>{copy.demo}</span>
          </div>
        </div>
      )}

      <section className="hero shell">
        <div className="hero-copy">
          <p className="section-kicker">{copy.kicker}</p>
          <h1>
            {copy.headline1}
            <br />
            <em>{copy.headline2}</em>
          </h1>
          <p className="hero-dek">{copy.intro}</p>
        </div>
        <aside className="principles" aria-label={copy.principlesLabel}>
          <p className="principles-label">{copy.principles}</p>
          <ol>
            {copy.principleItems.map((principle, index) => (
              <li key={principle}><span>0{index + 1}</span>{principle}</li>
            ))}
          </ol>
        </aside>
      </section>

      <section className="lead-story shell" aria-labelledby="lead-heading">
        <div className="section-heading">
          <p>{copy.featured}</p>
          <span>{lead.citations.length} {copy.recordedSources}</span>
        </div>
        <div className="lead-grid">
          <div className="lead-number" aria-hidden="true">
            01
          </div>
          <div className="lead-content">
            <p className="story-label">{copy.method}</p>
            <h2 id="lead-heading">
              <Link href={`/articles/${lead.slug}`}>{lead.title}</Link>
            </h2>
            <p>{lead.summary}</p>
            <Link className="text-link" href={`/articles/${lead.slug}`}>
              {copy.read} <span aria-hidden="true">→</span>
            </Link>
          </div>
          <div className="evidence-panel">
            <p>{copy.sourceFile}</p>
            <strong>{String(lead.citations.length).padStart(2, '0')}</strong>
            <span>{copy.documents}</span>
            <div className="evidence-rule" />
            <small>{copy.updated} {formatDate(lead.publishedAt, true, locale)}</small>
          </div>
        </div>
      </section>

      <section className="recent-section shell" aria-labelledby="recent-heading">
        <div className="section-heading section-heading-large">
          <h2 id="recent-heading">{copy.latest}</h2>
          <Link href="/recent">{copy.viewAll} →</Link>
        </div>
        <div className="article-list">
          {recent.map((article, index) => (
            <ArticleCard article={article} index={index} key={article.id} locale={locale} />
          ))}
        </div>
      </section>

      <section className="incident-feature" aria-labelledby="incident-heading">
        <div className="shell">
          <div className="section-heading section-heading-dark">
            <h2 id="incident-heading">{copy.notable}</h2>
            <Link href="/incidents">{copy.openIndex} →</Link>
          </div>
          <IncidentCard incident={featuredIncident} locale={locale} />
          <div className="incident-feature-footer">
            <p>{copy.statusNote}</p>
            <Link className="outline-link" href="/timeline">
              {copy.byYear}
            </Link>
          </div>
        </div>
      </section>

      <section className="contribute shell">
        <p className="section-kicker">{copy.forAuthors}</p>
        <div>
          <h2>{copy.submitTitle}</h2>
          <p>{copy.submitDescription}</p>
        </div>
        <Link className="primary-button" href="/admin">
          {copy.authorArea} <span aria-hidden="true">↗</span>
        </Link>
      </section>
    </>
  )
}
