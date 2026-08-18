'use server'

import config from '@payload-config'
import { redirect } from 'next/navigation'
import { getPayload } from 'payload'

import { syncSupabaseAuthor } from '@/lib/author-identity'
import { getCurrentSupabaseUser } from '@/lib/auth'
import type { Locale } from '@/lib/i18n'

export type ArticleField =
  | 'authors'
  | 'bodyMarkdown'
  | 'citationAccessedAt'
  | 'citationTitle'
  | 'citationUrl'
  | 'eventDate'
  | 'summary'
  | 'title'

export type ArticleSubmissionState = {
  status: 'idle' | 'error'
  message: string
  fieldErrors?: Partial<Record<ArticleField, string>>
}

export const initialArticleSubmissionState: ArticleSubmissionState = { status: 'idle', message: '' }

const valueOf = (formData: FormData, name: string) => {
  const value = formData.get(name)
  return typeof value === 'string' ? value.trim() : ''
}

const isDate = (value: string) => /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(Date.parse(`${value}T00:00:00Z`))

const isHttpURL = (value: string) => {
  try {
    const url = new URL(value)
    return url.protocol === 'http:' || url.protocol === 'https:'
  } catch {
    return false
  }
}

export async function submitArticle(
  _previousState: ArticleSubmissionState,
  formData: FormData,
): Promise<ArticleSubmissionState> {
  const locale: Locale = valueOf(formData, 'locale') === 'en' ? 'en' : 'vi'
  const message = (vi: string, en: string) => (locale === 'vi' ? vi : en)
  const title = valueOf(formData, 'title')
  const eventDate = valueOf(formData, 'eventDate')
  const summary = valueOf(formData, 'summary')
  const bodyMarkdown = valueOf(formData, 'bodyMarkdown')
  const authors = valueOf(formData, 'authors')
  const citationTitle = valueOf(formData, 'citationTitle')
  const citationUrl = valueOf(formData, 'citationUrl')
  const citationAccessedAt = valueOf(formData, 'citationAccessedAt')
  const fieldErrors: ArticleSubmissionState['fieldErrors'] = {}

  if (title.length < 5 || title.length > 180) fieldErrors.title = message('Tiêu đề cần từ 5 đến 180 ký tự.', 'Title must be between 5 and 180 characters.')
  if (!isDate(eventDate)) fieldErrors.eventDate = message('Chọn ngày hợp lệ.', 'Choose a valid date.')
  if (summary.length < 30 || summary.length > 320) fieldErrors.summary = message('Tóm tắt cần từ 30 đến 320 ký tự.', 'Summary must be between 30 and 320 characters.')
  if (bodyMarkdown.length < 100 || bodyMarkdown.length > 100_000) fieldErrors.bodyMarkdown = message('Nội dung cần từ 100 đến 100.000 ký tự.', 'The article must be between 100 and 100,000 characters.')
  if (authors.length > 500) fieldErrors.authors = message('Danh sách tác giả quá dài.', 'The author list is too long.')
  if (citationTitle.length < 2 || citationTitle.length > 240) fieldErrors.citationTitle = message('Nhập tên nguồn hợp lệ.', 'Enter a valid source title.')
  if (!isHttpURL(citationUrl)) fieldErrors.citationUrl = message('Liên kết nguồn phải dùng http:// hoặc https://.', 'The source URL must use http:// or https://.')
  if (!isDate(citationAccessedAt)) fieldErrors.citationAccessedAt = message('Chọn ngày truy cập hợp lệ.', 'Choose a valid access date.')

  if (Object.keys(fieldErrors).length) {
    return { status: 'error', message: message('Kiểm tra lại thông tin.', 'Check the highlighted fields.'), fieldErrors }
  }

  const supabaseUser = await getCurrentSupabaseUser()
  if (!supabaseUser) redirect('/login?next=/author/articles/new')

  try {
    const author = await syncSupabaseAuthor(supabaseUser)
    const payload = await getPayload({ config })
    const byline = authors
      .split(',')
      .map((name) => name.trim())
      .filter(Boolean)
      .slice(0, 10)
      .map((name) => ({ name: name.slice(0, 100) }))

    await payload.create({
      collection: 'articles',
      draft: true,
      overrideAccess: false,
      user: author,
      data: {
        _status: 'draft',
        authors: [author.id],
        bodyMarkdown,
        byline: byline.length ? byline : undefined,
        citations: [{
          accessedAt: new Date(`${citationAccessedAt}T00:00:00Z`).toISOString(),
          sourceTitle: citationTitle,
          url: citationUrl,
        }],
        eventDate: new Date(`${eventDate}T00:00:00Z`).toISOString(),
        summary,
        title,
        workflowStatus: 'submitted',
      },
    })
  } catch (error) {
    console.error('[author] article submission failed', error)
    return {
      status: 'error',
      message: message('Chưa thể gửi bài lúc này. Vui lòng thử lại sau.', 'The article could not be submitted. Try again later.'),
    }
  }

  redirect('/author?submitted=1')
}
