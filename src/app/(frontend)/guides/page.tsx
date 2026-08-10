import type { Metadata } from 'next'
import Link from 'next/link'

import { getLocale } from '@/lib/get-locale'
import type { Locale } from '@/lib/i18n'

type Guide = {
  id: string
  audience: string
  title: string
  description: string
  action: string
  href: string
  steps: Array<{ title: string; description: string }>
}

const guideCopy: Record<Locale, { navigation: string; note: string; guides: Guide[] }> = {
  vi: {
    navigation: 'Chọn hướng dẫn',
    note: 'Không gửi mật khẩu, dữ liệu đăng nhập hoặc tài liệu có thể khiến bạn gặp nguy hiểm. Bản MVP chỉ nhận liên kết.',
    guides: [
      {
        id: 'review', audience: 'Dành cho người duyệt', title: 'Duyệt bài', description: 'Kiểm tra nội dung, nguồn và gửi quyết định biên tập.', action: 'Mở danh sách bài', href: '/admin/collections/articles',
        steps: [
          { title: 'Chọn bài đã gửi', description: 'Trong Articles, mở bài có trạng thái Submitted. Chuyển sang In review khi bắt đầu xử lý.' },
          { title: 'Kiểm tra nội dung và nguồn', description: 'Đọc bản Markdown, đối chiếu ngày, tên, số liệu và mở từng citation. Ghi rõ mọi khoảng trống cần tác giả bổ sung.' },
          { title: 'Tạo quyết định duyệt', description: 'Trong Reviews, chọn bài rồi chọn Approve, Request changes hoặc Reject. Viết nhận xét cụ thể cho tác giả.' },
          { title: 'Lưu quyết định', description: 'Trạng thái bài được cập nhật tự động. Bài đã duyệt vẫn cần quản trị viên xuất bản.' },
        ],
      },
      {
        id: 'submit', audience: 'Dành cho tác giả', title: 'Gửi bài', description: 'Tạo bản thảo Markdown và gửi vào quy trình biên tập.', action: 'Tạo bài mới', href: '/admin/collections/articles/create',
        steps: [
          { title: 'Tạo bản thảo', description: 'Đăng nhập khu vực tác giả, mở Articles và chọn Create New.' },
          { title: 'Điền phần bài viết', description: 'Thêm tiêu đề, ngày sự kiện, tóm tắt và nội dung Markdown. Tác giả hoặc bút danh là không bắt buộc.' },
          { title: 'Thêm citation', description: 'Mỗi nguồn cần tên, liên kết và ngày truy cập. Thêm bản lưu hoặc ghi chú liên quan khi có.' },
          { title: 'Gửi để duyệt', description: 'Lưu bản nháp trước. Khi sẵn sàng, đặt Workflow Status thành Submitted và lưu lại.' },
        ],
      },
      {
        id: 'contribute', audience: 'Dành cho cộng đồng', title: 'Góp thông tin', description: 'Gửi tài liệu hoặc đầu mối cho một hồ sơ đang mở.', action: 'Chọn hồ sơ', href: '/incidents',
        steps: [
          { title: 'Chọn hồ sơ đang mở', description: 'Mở một hồ sơ có nút Đóng góp thông tin. Hồ sơ đã đóng sẽ không nhận nội dung mới.' },
          { title: 'Mô tả điều bạn biết', description: 'Chọn loại đóng góp, viết tiêu đề ngắn và nêu rõ thông tin, nguồn gốc cùng phần cần kiểm chứng.' },
          { title: 'Thêm liên kết và email', description: 'Đính kèm liên kết nguồn nếu có. Email chỉ dùng để ban biên tập liên hệ và không được công khai.' },
          { title: 'Gửi để xác minh', description: 'Đóng góp được tiếp nhận riêng tư. Chỉ nội dung đã kiểm chứng và được duyệt mới xuất hiện trên hồ sơ.' },
        ],
      },
    ],
  },
  en: {
    navigation: 'Choose a guide',
    note: 'Do not submit passwords, login details, or documents that could put you at risk. The MVP accepts links only.',
    guides: [
      {
        id: 'review', audience: 'For reviewers', title: 'Review an article', description: 'Check the reporting and sources, then submit an editorial decision.', action: 'Open article list', href: '/admin/collections/articles',
        steps: [
          { title: 'Choose a submission', description: 'In Articles, open an item with Submitted status. Change it to In review when you begin.' },
          { title: 'Check the reporting and sources', description: 'Read the Markdown, verify dates, names, and figures, and open every citation. Record any gap the author must address.' },
          { title: 'Create a review decision', description: 'In Reviews, choose the article and select Approve, Request changes, or Reject. Give the author specific comments.' },
          { title: 'Save the decision', description: 'The article status updates automatically. An administrator must still publish an approved article.' },
        ],
      },
      {
        id: 'submit', audience: 'For authors', title: 'Submit an article', description: 'Create a Markdown draft and send it into editorial review.', action: 'Create article', href: '/admin/collections/articles/create',
        steps: [
          { title: 'Create a draft', description: 'Sign in to the author area, open Articles, and choose Create New.' },
          { title: 'Complete the story fields', description: 'Add the title, event date, summary, and Markdown body. Account authors and public bylines are optional.' },
          { title: 'Add citations', description: 'Every source needs a title, link, and access date. Add an archive or relevance note when available.' },
          { title: 'Submit for review', description: 'Save the draft first. When ready, set Workflow Status to Submitted and save again.' },
        ],
      },
      {
        id: 'contribute', audience: 'For the community', title: 'Contribute to a case', description: 'Send a document or lead to a case that is accepting contributions.', action: 'Choose a case', href: '/incidents',
        steps: [
          { title: 'Choose an open case', description: 'Open a case that shows the Contribute information button. Closed cases do not accept new submissions.' },
          { title: 'Describe what you know', description: 'Choose a contribution type, write a short title, and explain the information, its origin, and what still needs verification.' },
          { title: 'Add a link and email', description: 'Include a source link when available. Your email is used only for editorial contact and is never displayed publicly.' },
          { title: 'Submit for verification', description: 'The contribution is received privately. Only verified and approved information appears on the case page.' },
        ],
      },
    ],
  },
}

export async function generateMetadata(): Promise<Metadata> {
  const title = (await getLocale()) === 'vi' ? 'Hướng dẫn' : 'Guides'
  return { title, alternates: { canonical: '/guides' }, openGraph: { title } }
}

export default async function GuidesPage() {
  const locale = await getLocale()
  const copy = guideCopy[locale]

  return (
    <div className="guides-page shell">
      <h1 className="sr-only">{locale === 'vi' ? 'Hướng dẫn' : 'Guides'}</h1>

      <nav className="guide-index" aria-label={copy.navigation}>
        {copy.guides.map((guide, index) => (
          <a href={`#${guide.id}`} key={guide.id}>
            <span>{String(index + 1).padStart(2, '0')}</span>
            <strong>{guide.title}</strong>
            <small>{guide.audience}</small>
          </a>
        ))}
      </nav>

      {copy.guides.map((guide, guideIndex) => (
        <section className="guide-section" id={guide.id} aria-labelledby={`${guide.id}-heading`} key={guide.id}>
          <header>
            <span>{String(guideIndex + 1).padStart(2, '0')}</span>
            <p>{guide.audience}</p>
            <h2 id={`${guide.id}-heading`}>{guide.title}</h2>
            <Link className="guide-action" href={guide.href}>{guide.action} {guide.id === 'contribute' ? '→' : '↗'}</Link>
          </header>
          <ol className="guide-steps">
            {guide.steps.map((step, stepIndex) => (
              <li key={step.title}>
                <span>{String(stepIndex + 1).padStart(2, '0')}</span>
                <div>
                  <h3>{step.title}</h3>
                  <p>{step.description}</p>
                </div>
              </li>
            ))}
          </ol>
        </section>
      ))}

      <p className="guide-note">{copy.note}</p>
    </div>
  )
}
