export type ArticleField =
  'authors' | 'bodyMarkdown' | 'citations' | 'eventDate' | 'summary' | 'title'

export type ArticleSubmissionState = {
  status: 'idle' | 'error'
  message: string
  fieldErrors?: Partial<Record<ArticleField, string>>
}

export type ArticleFormCitation = {
  accessedAt?: string | null
  citationKey?: string | null
  sourceTitle?: string | null
  url?: string | null
}

export type ArticleFormValue = {
  authors?: string
  bodyMarkdown?: string | null
  citations?: ArticleFormCitation[] | null
  eventDate?: string | null
  id: number | string
  summary?: string | null
  title?: string | null
}

export const MAX_SAVED_ARTICLE_DRAFTS = 10

export const initialArticleSubmissionState: ArticleSubmissionState = {
  status: 'idle',
  message: '',
}
