import type { ArticleView, CommunityContributionView, IncidentView } from './content'

const demonstrationCitation = {
  sourceTitle: 'Tài liệu minh họa cho bản MVP',
  publisher: 'Open Journalism',
  url: 'https://example.com/minh-hoa',
  accessedAt: '2026-08-01T00:00:00.000Z',
  note: 'Liên kết mẫu. Thay bằng nguồn đã được phóng viên và biên tập viên xác minh.',
}

export const demoArticles: ArticleView[] = [
  {
    id: 'demo-article-1',
    slug: 'cach-doc-ho-so-dau-thau-cong',
    title: 'Cách đọc một hồ sơ đấu thầu công',
    summary:
      'Một quy trình minh họa để đối chiếu thông báo mời thầu, quyết định phê duyệt và dữ liệu nghiệm thu.',
    bodyMarkdown: `## Từ câu hỏi đến tài liệu

Bài viết mẫu này trình bày cách một nhóm điều tra có thể biến một dấu hiệu bất thường thành câu hỏi có thể kiểm chứng.

### Ba lớp kiểm tra

1. Xác định tài liệu gốc và thời điểm công bố.
2. Đối chiếu số tiền, đơn vị và mốc thời gian giữa các hồ sơ.
3. Ghi lại mọi giả định, khoảng trống dữ liệu và phản hồi của bên liên quan.

> Đây là nội dung minh họa cho bản MVP, không mô tả một vụ việc có thật.

Kết luận chỉ được xuất bản khi bằng chứng, ngữ cảnh và quyền phản hồi đã được biên tập viên xem xét.`,
    eventDate: '2026-07-24T00:00:00.000Z',
    publishedAt: '2026-08-02T08:30:00.000Z',
    topics: ['public-spending'],
    byline: ['Ban dữ liệu'],
    citations: [demonstrationCitation],
    featured: true,
    isDemo: true,
  },
  {
    id: 'demo-article-2',
    slug: 'theo-dau-du-an-tu-phe-duyet-den-nghiem-thu',
    title: 'Theo dấu một dự án từ phê duyệt đến nghiệm thu',
    summary:
      'Dữ liệu thời gian giúp nhìn thấy những thay đổi mà một bản tin riêng lẻ thường bỏ qua.',
    bodyMarkdown: `## Vì sao cần một dòng thời gian?

Một dự án công có thể trải qua nhiều quyết định, điều chỉnh và lần nghiệm thu. Khi từng mốc được lưu thành dữ liệu có nguồn, độc giả có thể tự nhìn thấy trình tự thay đổi.

- Mỗi mốc cần ngày, mô tả và nguồn.
- Ngày xảy ra sự kiện khác với ngày bài viết được xuất bản.
- Những điều chưa biết phải được ghi rõ.

_Nội dung minh họa, không phải tin tức thực tế._`,
    eventDate: '2026-07-11T00:00:00.000Z',
    publishedAt: '2026-07-28T06:00:00.000Z',
    topics: ['public-services'],
    byline: ['Nhóm điều tra'],
    citations: [demonstrationCitation],
    isDemo: true,
  },
  {
    id: 'demo-article-3',
    slug: 'khi-hai-bo-du-lieu-khong-khop',
    title: 'Khi hai bộ dữ liệu không khớp, cần hỏi gì trước?',
    summary:
      'Chênh lệch dữ liệu là điểm bắt đầu của việc xác minh, không phải bằng chứng cuối cùng của sai phạm.',
    bodyMarkdown: `## Không vội kết luận

Hai con số khác nhau có thể đến từ kỳ báo cáo, phương pháp tính hoặc một bản cập nhật chưa đồng bộ. Bước đầu tiên là hỏi đơn vị quản lý dữ liệu về định nghĩa và lịch sử chỉnh sửa.

Chỉ sau khi loại trừ các khác biệt kỹ thuật, nhóm điều tra mới đánh giá những giả thuyết tiếp theo.

_Nội dung minh họa, không phải tin tức thực tế._`,
    eventDate: '2026-06-30T00:00:00.000Z',
    publishedAt: '2026-07-16T05:45:00.000Z',
    topics: ['public-spending', 'public-services'],
    byline: ['Minh An'],
    citations: [demonstrationCitation],
    isDemo: true,
  },
]

export const demoIncidents: IncidentView[] = [
  {
    id: 'demo-incident-1',
    slug: 'ho-so-mau-khoang-trong-chuoi-phe-duyet',
    title: 'Hồ sơ mẫu A: Khoảng trống trong chuỗi phê duyệt',
    summary:
      'Một bản ghi minh họa cho cách hiển thị sự kiện, trạng thái xác minh và nguồn liên quan.',
    notabilityReason:
      'Trình tự tài liệu còn thiếu một mốc giải trình. Nhóm biên tập sẽ đánh dấu khoảng trống thay vì suy đoán.',
    dateStart: '2026-01-18T00:00:00.000Z',
    location: 'Địa điểm minh họa',
    caseStatus: 'accepting-contributions',
    crowdsourcingEnabled: true,
    status: 'under-review',
    severity: 'medium',
    citations: [demonstrationCitation, demonstrationCitation],
    citationCount: 2,
    featured: true,
    isDemo: true,
  },
  {
    id: 'demo-incident-2',
    slug: 'ho-so-mau-so-lieu-cong-bo-khong-dong-nhat',
    title: 'Hồ sơ mẫu B: Số liệu công bố chưa đồng nhất',
    summary:
      'Hai báo cáo mẫu sử dụng phạm vi thời gian khác nhau và cần được cơ quan liên quan giải thích.',
    notabilityReason:
      'Sự khác biệt có thể ảnh hưởng đến cách công chúng hiểu kết quả, nhưng chưa đủ để kết luận sai phạm.',
    dateStart: '2026-03-04T00:00:00.000Z',
    dateEnd: '2026-03-22T00:00:00.000Z',
    location: 'Phạm vi minh họa',
    caseStatus: 'investigating',
    crowdsourcingEnabled: false,
    status: 'disputed',
    severity: 'low',
    citations: [demonstrationCitation, demonstrationCitation, demonstrationCitation],
    citationCount: 3,
    isDemo: true,
  },
  {
    id: 'demo-incident-3',
    slug: 'ho-so-mau-phan-hoi-duoc-cong-bo',
    title: 'Hồ sơ mẫu C: Phản hồi và tài liệu bổ sung được công bố',
    summary:
      'Bản ghi minh họa cách cập nhật sự kiện khi xuất hiện phản hồi chính thức hoặc bằng chứng mới.',
    notabilityReason:
      'Cập nhật công khai giúp độc giả phân biệt thông tin ban đầu với những gì đã được làm rõ sau đó.',
    dateStart: '2026-05-09T00:00:00.000Z',
    location: 'Địa điểm minh họa',
    caseStatus: 'closed',
    crowdsourcingEnabled: false,
    status: 'resolved',
    severity: 'medium',
    citations: [
      demonstrationCitation,
      demonstrationCitation,
      demonstrationCitation,
      demonstrationCitation,
    ],
    citationCount: 4,
    isDemo: true,
  },
]

export const demoContributions: Record<string, CommunityContributionView[]> = {
  'ho-so-mau-khoang-trong-chuoi-phe-duyet': [
    {
      id: 'demo-contribution-1',
      title: 'Mốc công bố bổ sung trong kho dữ liệu công',
      description:
        'Một độc giả đã chỉ ra đường dẫn đến bản ghi công khai có ngày cập nhật nằm giữa hai mốc đang được đối chiếu. Nhóm biên tập đã kiểm tra liên kết trước khi đưa vào hồ sơ mẫu.',
      contributionType: 'document',
      sourceUrl: 'https://example.com/tai-lieu-cong-dong',
      contributorName: 'Một độc giả',
      approvedAt: '2026-08-05T00:00:00.000Z',
    },
  ],
}
