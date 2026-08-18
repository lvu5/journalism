'use client'

import { useActionState } from 'react'

import {
  initialArticleSubmissionState,
  submitArticle,
  type ArticleField,
} from '@/app/(frontend)/author/articles/new/actions'
import type { Locale } from '@/lib/i18n'

export function ArticleSubmissionForm({ locale }: { locale: Locale }) {
  const [state, formAction, isPending] = useActionState(submitArticle, initialArticleSubmissionState)
  const copy = locale === 'vi' ? {
    title: 'Tiêu đề', date: 'Ngày sự kiện', summary: 'Tóm tắt', body: 'Nội dung (Markdown)',
    bodyHelp: 'Markdown được hỗ trợ; HTML thô sẽ không được xuất bản.', authors: 'Tác giả khác (không bắt buộc)',
    authorsHelp: 'Phân cách nhiều tên bằng dấu phẩy.', citation: 'Nguồn trích dẫn đầu tiên', citationTitle: 'Tên nguồn',
    citationUrl: 'Liên kết nguồn', accessed: 'Ngày truy cập', submit: 'Gửi để duyệt', submitting: 'Đang gửi…',
  } : {
    title: 'Title', date: 'Event date', summary: 'Summary', body: 'Article (Markdown)',
    bodyHelp: 'Markdown is supported; raw HTML will not be published.', authors: 'Other authors (optional)',
    authorsHelp: 'Separate multiple names with commas.', citation: 'First citation', citationTitle: 'Source title',
    citationUrl: 'Source URL', accessed: 'Date accessed', submit: 'Submit for review', submitting: 'Submitting…',
  }

  const fieldError = (field: ArticleField) => state.fieldErrors?.[field]
    ? <small className="form-field-error" id={`${field}-error`}>{state.fieldErrors[field]}</small>
    : null

  return (
    <form action={formAction} className="contribution-form article-submission-form">
      <input name="locale" type="hidden" value={locale} />
      <div className="form-field">
        <label htmlFor="title">{copy.title}</label>
        <input aria-invalid={Boolean(state.fieldErrors?.title)} id="title" maxLength={180} minLength={5} name="title" required type="text" />
        {fieldError('title')}
      </div>
      <div className="form-field">
        <label htmlFor="eventDate">{copy.date}</label>
        <input aria-invalid={Boolean(state.fieldErrors?.eventDate)} id="eventDate" name="eventDate" required type="date" />
        {fieldError('eventDate')}
      </div>
      <div className="form-field">
        <label htmlFor="summary">{copy.summary}</label>
        <textarea aria-invalid={Boolean(state.fieldErrors?.summary)} id="summary" maxLength={320} minLength={30} name="summary" required rows={4} />
        {fieldError('summary')}
      </div>
      <div className="form-field">
        <label htmlFor="bodyMarkdown">{copy.body}</label>
        <textarea aria-invalid={Boolean(state.fieldErrors?.bodyMarkdown)} id="bodyMarkdown" maxLength={100000} minLength={100} name="bodyMarkdown" required rows={20} />
        <small>{copy.bodyHelp}</small>
        {fieldError('bodyMarkdown')}
      </div>
      <div className="form-field">
        <label htmlFor="authors">{copy.authors}</label>
        <input aria-invalid={Boolean(state.fieldErrors?.authors)} id="authors" maxLength={500} name="authors" type="text" />
        <small>{copy.authorsHelp}</small>
        {fieldError('authors')}
      </div>
      <fieldset className="form-fieldset">
        <legend>{copy.citation}</legend>
        <div className="form-field">
          <label htmlFor="citationTitle">{copy.citationTitle}</label>
          <input aria-invalid={Boolean(state.fieldErrors?.citationTitle)} id="citationTitle" maxLength={240} minLength={2} name="citationTitle" required type="text" />
          {fieldError('citationTitle')}
        </div>
        <div className="form-field">
          <label htmlFor="citationUrl">{copy.citationUrl}</label>
          <input aria-invalid={Boolean(state.fieldErrors?.citationUrl)} id="citationUrl" name="citationUrl" placeholder="https://" required type="url" />
          {fieldError('citationUrl')}
        </div>
        <div className="form-field">
          <label htmlFor="citationAccessedAt">{copy.accessed}</label>
          <input aria-invalid={Boolean(state.fieldErrors?.citationAccessedAt)} id="citationAccessedAt" name="citationAccessedAt" required type="date" />
          {fieldError('citationAccessedAt')}
        </div>
      </fieldset>
      {state.message && <p className="form-message form-message-error" role="alert">{state.message}</p>}
      <button className="primary-button" disabled={isPending} type="submit">
        <span>{isPending ? copy.submitting : copy.submit}</span><span aria-hidden="true">→</span>
      </button>
    </form>
  )
}
