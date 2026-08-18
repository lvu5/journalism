'use server'

import config from '@payload-config'
import { redirect } from 'next/navigation'
import { getPayload } from 'payload'

import { syncSupabaseAuthor } from '@/lib/author-identity'
import {
  MAX_SAVED_ARTICLE_DRAFTS,
  type ArticleSubmissionState,
} from '@/lib/article-submission-state'
import { getCurrentSupabaseUser } from '@/lib/auth'
import { findUnknownCitationKeys, isCitationKey, normalizeCitationKey } from '@/lib/citations'
import type { Locale } from '@/lib/i18n'
import type { Article } from '@/payload-types'

type CitationInput = {
  accessedAt: string
  citationKey: string
  sourceTitle: string
  url: string
}

const valueOf = (formData: FormData, name: string) => {
  const value = formData.get(name)
  return typeof value === 'string' ? value.trim() : ''
}

const valuesOf = (formData: FormData, name: string) =>
  formData.getAll(name).map((value) => (typeof value === 'string' ? value.trim() : ''))

const isDate = (value: string) =>
  /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(Date.parse(`${value}T00:00:00Z`))

const isHttpURL = (value: string) => {
  try {
    const url = new URL(value)
    return url.protocol === 'http:' || url.protocol === 'https:'
  } catch {
    return false
  }
}

const relationID = (value: Article['submittedBy']): number | string | null => {
  if (typeof value === 'number' || typeof value === 'string') return value
  return value?.id ?? null
}

export async function submitArticle(
  _previousState: ArticleSubmissionState,
  formData: FormData,
): Promise<ArticleSubmissionState> {
  const locale: Locale = valueOf(formData, 'locale') === 'en' ? 'en' : 'vi'
  const message = (vi: string, en: string) => (locale === 'vi' ? vi : en)
  const intent = valueOf(formData, 'intent') === 'draft' ? 'draft' : 'submit'
  const isDraft = intent === 'draft'
  const articleIDValue = valueOf(formData, 'articleId')
  const articleID = /^\d+$/.test(articleIDValue) ? Number(articleIDValue) : null
  const title = valueOf(formData, 'title')
  const eventDate = valueOf(formData, 'eventDate')
  const summary = valueOf(formData, 'summary')
  const bodyMarkdown = valueOf(formData, 'bodyMarkdown')
  const authors = valueOf(formData, 'authors')
  const citationKeys = valuesOf(formData, 'citationKey')
  const citationTitles = valuesOf(formData, 'citationTitle')
  const citationUrls = valuesOf(formData, 'citationUrl')
  const citationAccessedDates = valuesOf(formData, 'citationAccessedAt')
  const citationFieldLengths = [
    citationKeys.length,
    citationTitles.length,
    citationUrls.length,
    citationAccessedDates.length,
  ]
  const citationRowCount = Math.max(0, ...citationFieldLengths)
  const citationFieldsAlign = citationFieldLengths.every((length) => length === citationRowCount)
  const citationRows: CitationInput[] = Array.from({ length: citationRowCount }, (_, index) => ({
    accessedAt: citationAccessedDates[index] || '',
    citationKey: citationKeys[index] || '',
    sourceTitle: citationTitles[index] || '',
    url: citationUrls[index] || '',
  })).filter((citation) => Object.values(citation).some(Boolean))
  const normalizedCitationKeys = citationRows.map((citation, index) =>
    normalizeCitationKey(citation.citationKey || `source-${index + 1}`),
  )
  const duplicateCitationKeys = normalizedCitationKeys.filter(
    (key, index) => normalizedCitationKeys.indexOf(key) !== index,
  )
  const fieldErrors: ArticleSubmissionState['fieldErrors'] = {}

  if (title.length > 180 || (isDraft ? title.length < 1 : title.length < 5)) {
    fieldErrors.title = isDraft
      ? message('Thêm tiêu đề trước khi lưu bản nháp.', 'Add a title before saving the draft.')
      : message('Tiêu đề cần từ 5 đến 180 ký tự.', 'Title must be between 5 and 180 characters.')
  }
  if ((!isDraft && !isDate(eventDate)) || (isDraft && eventDate && !isDate(eventDate))) {
    fieldErrors.eventDate = message('Chọn ngày hợp lệ.', 'Choose a valid date.')
  }
  if (summary.length > 320 || (!isDraft && summary.length < 30)) {
    fieldErrors.summary = message(
      isDraft ? 'Tóm tắt không được quá 320 ký tự.' : 'Tóm tắt cần từ 30 đến 320 ký tự.',
      isDraft
        ? 'The summary cannot exceed 320 characters.'
        : 'Summary must be between 30 and 320 characters.',
    )
  }
  if (bodyMarkdown.length > 100_000 || (!isDraft && bodyMarkdown.length < 100)) {
    fieldErrors.bodyMarkdown = message(
      isDraft ? 'Nội dung không được quá 100.000 ký tự.' : 'Nội dung cần từ 100 đến 100.000 ký tự.',
      isDraft
        ? 'The article cannot exceed 100,000 characters.'
        : 'The article must be between 100 and 100,000 characters.',
    )
  }
  if (authors.length > 500) {
    fieldErrors.authors = message('Danh sách tác giả quá dài.', 'The author list is too long.')
  }

  const draftCitationsAreValid =
    citationRows.length <= 50 &&
    citationFieldsAlign &&
    duplicateCitationKeys.length === 0 &&
    citationRows.every(
      (citation) =>
        (!citation.citationKey || isCitationKey(citation.citationKey)) &&
        citation.sourceTitle.length <= 240 &&
        (!citation.url || isHttpURL(citation.url)) &&
        (!citation.accessedAt || isDate(citation.accessedAt)),
    )
  const submittedCitationsAreValid =
    citationRows.length >= 1 &&
    draftCitationsAreValid &&
    citationRows.every(
      (citation) =>
        Boolean(citation.citationKey) &&
        citation.sourceTitle.length >= 2 &&
        isHttpURL(citation.url) &&
        isDate(citation.accessedAt),
    )

  if (isDraft ? !draftCitationsAreValid : !submittedCitationsAreValid) {
    fieldErrors.citations = message(
      isDraft
        ? 'Kiểm tra các nguồn đã điền. Mỗi mã nguồn phải hợp lệ và duy nhất.'
        : 'Kiểm tra mã nguồn, tên, liên kết và ngày truy cập. Mỗi mã nguồn phải là duy nhất.',
      isDraft
        ? 'Check the source details entered so far. Every source key must be valid and unique.'
        : 'Check every source key, title, URL, and access date. Each source key must be unique.',
    )
  }

  if (!isDraft) {
    const unknownCitationKeys = findUnknownCitationKeys(bodyMarkdown, normalizedCitationKeys)
    if (unknownCitationKeys.length) {
      fieldErrors.bodyMarkdown = message(
        `Không tìm thấy mã nguồn: ${unknownCitationKeys.join(', ')}.`,
        `Unknown citation key: ${unknownCitationKeys.join(', ')}.`,
      )
    }
  }

  if (Object.keys(fieldErrors).length) {
    return {
      status: 'error',
      message: message('Kiểm tra lại thông tin.', 'Check the highlighted fields.'),
      fieldErrors,
    }
  }

  const supabaseUser = await getCurrentSupabaseUser()
  const returnPath = articleID ? `/author/articles/${articleID}/edit` : '/author/articles/new'
  if (!supabaseUser) redirect(`/login?next=${encodeURIComponent(returnPath)}`)

  let savedArticleID: number | string | null = null
  try {
    const author = await syncSupabaseAuthor(supabaseUser)
    const payload = await getPayload({ config })
    let existingArticle: Article | null = null

    if (articleID) {
      try {
        existingArticle = await payload.findByID({
          collection: 'articles',
          id: articleID,
          depth: 0,
          overrideAccess: false,
          user: author,
        })
      } catch {
        existingArticle = null
      }
      if (
        !existingArticle ||
        existingArticle.workflowStatus !== 'draft' ||
        String(relationID(existingArticle.submittedBy)) !== String(author.id)
      ) {
        return {
          status: 'error',
          message: message(
            'Không thể chỉnh sửa bản nháp này.',
            'This draft cannot be edited from this account.',
          ),
        }
      }
    }

    if (isDraft && !existingArticle) {
      const drafts = await payload.count({
        collection: 'articles',
        overrideAccess: false,
        user: author,
        where: {
          and: [{ submittedBy: { equals: author.id } }, { workflowStatus: { equals: 'draft' } }],
        },
      })
      if (drafts.totalDocs >= MAX_SAVED_ARTICLE_DRAFTS) {
        return {
          status: 'error',
          message: message(
            'Bạn đã có 10 bản nháp. Hãy gửi hoặc tiếp tục một bản nháp trước khi tạo thêm.',
            'You already have 10 saved drafts. Submit or continue one before creating another.',
          ),
        }
      }
    }

    const byline = authors
      .split(',')
      .map((name) => name.trim())
      .filter(Boolean)
      .slice(0, 10)
      .map((name) => ({ name: name.slice(0, 100) }))
    const citations = citationRows.map((citation, index) => ({
      citationKey: normalizedCitationKeys[index],
      sourceTitle: citation.sourceTitle,
      url: citation.url,
      ...(citation.accessedAt
        ? { accessedAt: new Date(`${citation.accessedAt}T00:00:00Z`).toISOString() }
        : {}),
    })) as Article['citations']
    const articleData = {
      _status: 'draft' as const,
      authors: [author.id],
      bodyMarkdown,
      byline,
      citations,
      ...(eventDate ? { eventDate: new Date(`${eventDate}T00:00:00Z`).toISOString() } : {}),
      summary,
      title,
      workflowStatus: isDraft ? ('draft' as const) : ('submitted' as const),
    }

    const savedArticle = existingArticle
      ? await payload.update({
          collection: 'articles',
          id: existingArticle.id,
          draft: true,
          overrideAccess: false,
          user: author,
          data: articleData,
        })
      : await payload.create({
          collection: 'articles',
          draft: true,
          overrideAccess: false,
          user: author,
          data: articleData,
        })
    savedArticleID = savedArticle.id
  } catch (error) {
    console.error('[author] article save failed', error)
    return {
      status: 'error',
      message: message(
        isDraft
          ? 'Chưa thể lưu bản nháp lúc này. Vui lòng thử lại sau.'
          : 'Chưa thể gửi bài lúc này. Vui lòng thử lại sau.',
        isDraft
          ? 'The draft could not be saved. Try again later.'
          : 'The article could not be submitted. Try again later.',
      ),
    }
  }

  if (isDraft) redirect(`/author/articles/${savedArticleID}/edit?saved=1`)
  redirect('/author?submitted=1')
}
