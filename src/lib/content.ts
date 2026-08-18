import { localeTags, type Locale } from './i18n'

export type CitationView = {
  citationKey?: string | null
  sourceTitle: string
  publisher?: string | null
  url: string
  accessedAt: string
  archiveUrl?: string | null
  note?: string | null
}

export type ArticleView = {
  id: number | string
  slug: string
  title: string
  summary: string
  bodyMarkdown: string
  eventDate: string
  publishedAt: string
  topics: string[]
  byline: string[]
  citations: CitationView[]
  corrections: CorrectionView[]
  featured?: boolean
  isDemo?: boolean
}

export type CorrectionView = {
  note: string
  issuedAt: string
}

export type IncidentView = {
  id: number | string
  slug: string
  title: string
  summary: string
  notabilityReason: string
  dateStart: string
  dateEnd?: string | null
  location?: string | null
  caseStatus:
    | 'newly-opened'
    | 'investigating'
    | 'accepting-contributions'
    | 'reviewing-contributions'
    | 'closed'
  crowdsourcingEnabled: boolean
  status: 'under-review' | 'disputed' | 'confirmed' | 'resolved'
  severity: 'low' | 'medium' | 'high'
  citations: CitationView[]
  citationCount: number
  featured?: boolean
  isDemo?: boolean
}

export type CommunityContributionView = {
  id: number | string
  title: string
  description: string
  contributionType: 'document' | 'eyewitness' | 'data-tip' | 'correction' | 'context' | 'other'
  sourceUrl?: string | null
  contributorName?: string | null
  approvedAt?: string | null
}

export type IncidentDetailView = IncidentView & {
  approvedContributions: CommunityContributionView[]
}

export const topicLabels: Record<Locale, Record<string, string>> = {
  vi: {
    'public-spending': 'Chi tiêu công',
    environment: 'Môi trường',
    justice: 'Tư pháp',
    labour: 'Lao động',
    land: 'Đất đai',
    'public-services': 'Dịch vụ công',
  },
  en: {
    'public-spending': 'Public spending',
    environment: 'Environment',
    justice: 'Justice',
    labour: 'Labour',
    land: 'Land',
    'public-services': 'Public services',
  },
}

export const statusLabels: Record<Locale, Record<IncidentView['status'], string>> = {
  vi: {
    'under-review': 'Đang xác minh',
    disputed: 'Còn tranh luận',
    confirmed: 'Đã xác nhận',
    resolved: 'Đã xử lý',
  },
  en: {
    'under-review': 'Under review',
    disputed: 'Disputed',
    confirmed: 'Confirmed',
    resolved: 'Resolved',
  },
}

export const caseStatusLabels: Record<Locale, Record<IncidentView['caseStatus'], string>> = {
  vi: {
    'newly-opened': 'Hồ sơ mới mở',
    investigating: 'Đang điều tra',
    'accepting-contributions': 'Kêu gọi cộng đồng',
    'reviewing-contributions': 'Đang thẩm định',
    closed: 'Đã đóng hồ sơ',
  },
  en: {
    'newly-opened': 'New case',
    investigating: 'Investigating',
    'accepting-contributions': 'Open to contributions',
    'reviewing-contributions': 'Reviewing contributions',
    closed: 'Case closed',
  },
}

export const caseStatusDescriptions: Record<Locale, Record<IncidentView['caseStatus'], string>> = {
  vi: {
    'newly-opened': 'Vụ việc vừa được đưa vào hệ thống và đang xác định phạm vi.',
    investigating: 'Nhóm điều tra đang thu thập tài liệu và kiểm chứng thông tin.',
    'accepting-contributions': 'Hồ sơ đang nhận tài liệu, dữ liệu và lời kể từ cộng đồng.',
    'reviewing-contributions': 'Những đóng góp đã nhận đang được sàng lọc và xác minh.',
    closed: 'Hồ sơ không còn nhận thông tin mới nhưng vẫn được lưu để công chúng tra cứu.',
  },
  en: {
    'newly-opened': 'The case has just been opened and its scope is being defined.',
    investigating: 'The reporting team is gathering records and verifying information.',
    'accepting-contributions':
      'The case is accepting documents, data, and accounts from the public.',
    'reviewing-contributions': 'Received contributions are being screened and verified.',
    closed: 'The case is no longer accepting information but remains available as a public record.',
  },
}

export const contributionTypeLabels: Record<
  Locale,
  Record<CommunityContributionView['contributionType'], string>
> = {
  vi: {
    document: 'Tài liệu hoặc hồ sơ công',
    eyewitness: 'Lời kể trực tiếp',
    'data-tip': 'Đầu mối dữ liệu',
    correction: 'Đính chính',
    context: 'Bối cảnh bổ sung',
    other: 'Thông tin khác',
  },
  en: {
    document: 'Document or public record',
    eyewitness: 'First-hand account',
    'data-tip': 'Data lead',
    correction: 'Correction',
    context: 'Additional context',
    other: 'Other information',
  },
}

export const formatDate = (value: string, includeYear = true, locale: Locale = 'vi') =>
  new Intl.DateTimeFormat(localeTags[locale], {
    day: '2-digit',
    month: '2-digit',
    ...(includeYear ? { year: 'numeric' } : {}),
  }).format(new Date(value))
