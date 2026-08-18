export type ArticleField =
  'authors' | 'bodyMarkdown' | 'citations' | 'eventDate' | 'summary' | 'title'

export type ArticleSubmissionState = {
  status: 'idle' | 'error'
  message: string
  fieldErrors?: Partial<Record<ArticleField, string>>
}

export const initialArticleSubmissionState: ArticleSubmissionState = {
  status: 'idle',
  message: '',
}
