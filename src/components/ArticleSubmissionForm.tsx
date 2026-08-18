'use client'

import { useActionState, useRef, useState } from 'react'

import { submitArticle } from '@/app/(frontend)/author/articles/new/actions'
import { initialArticleSubmissionState, type ArticleField } from '@/lib/article-submission-state'
import type { Locale } from '@/lib/i18n'

type CitationRow = { id: number }

export function ArticleSubmissionForm({ locale }: { locale: Locale }) {
  const [state, formAction, isPending] = useActionState(
    submitArticle,
    initialArticleSubmissionState,
  )
  const [citationRows, setCitationRows] = useState<CitationRow[]>([{ id: 0 }])
  const nextCitationID = useRef(1)
  const copy =
    locale === 'vi'
      ? {
          title: 'Tiêu đề',
          date: 'Ngày sự kiện',
          summary: 'Tóm tắt',
          body: 'Nội dung (Markdown)',
          bodyHelp: 'Trích dẫn trong bài bằng mã nguồn, ví dụ',
          authors: 'Tác giả khác (không bắt buộc)',
          authorsHelp: 'Phân cách nhiều tên bằng dấu phẩy.',
          citations: 'Nguồn trích dẫn',
          citationHelp:
            'Tạo một mã ngắn, duy nhất cho mỗi nguồn. Có thể trích dẫn nhiều nguồn cùng lúc.',
          citationKey: 'Mã nguồn',
          citationKeyHelp: 'Bắt đầu bằng chữ; chỉ dùng chữ không dấu, số, :, _ hoặc -.',
          citationTitle: 'Tên nguồn',
          citationUrl: 'Liên kết nguồn',
          accessed: 'Ngày truy cập',
          addCitation: 'Thêm nguồn',
          removeCitation: 'Xóa',
          source: 'Nguồn',
          submit: 'Gửi để duyệt',
          submitting: 'Đang gửi…',
        }
      : {
          title: 'Title',
          date: 'Event date',
          summary: 'Summary',
          body: 'Article (Markdown)',
          bodyHelp: 'Cite a source inline by its key, for example',
          authors: 'Other authors (optional)',
          authorsHelp: 'Separate multiple names with commas.',
          citations: 'Citation sources',
          citationHelp:
            'Give every source a short, unique key. Several sources can be cited together.',
          citationKey: 'Source key',
          citationKeyHelp: 'Start with a letter; use letters, numbers, :, _ or -.',
          citationTitle: 'Source title',
          citationUrl: 'Source URL',
          accessed: 'Date accessed',
          addCitation: 'Add source',
          removeCitation: 'Remove',
          source: 'Source',
          submit: 'Submit for review',
          submitting: 'Submitting…',
        }

  const fieldError = (field: ArticleField) =>
    state.fieldErrors?.[field] ? (
      <small className="form-field-error" id={`${field}-error`}>
        {state.fieldErrors[field]}
      </small>
    ) : null

  const addCitation = () => {
    const id = nextCitationID.current
    nextCitationID.current += 1
    setCitationRows((rows) => [...rows, { id }])
  }

  const removeCitation = (id: number) => {
    setCitationRows((rows) => rows.filter((row) => row.id !== id))
  }

  return (
    <form action={formAction} className="contribution-form article-submission-form">
      <input name="locale" type="hidden" value={locale} />
      <div className="form-field">
        <label htmlFor="title">{copy.title}</label>
        <input
          aria-invalid={Boolean(state.fieldErrors?.title)}
          id="title"
          maxLength={180}
          minLength={5}
          name="title"
          required
          type="text"
        />
        {fieldError('title')}
      </div>
      <div className="form-field">
        <label htmlFor="eventDate">{copy.date}</label>
        <input
          aria-invalid={Boolean(state.fieldErrors?.eventDate)}
          id="eventDate"
          name="eventDate"
          required
          type="date"
        />
        {fieldError('eventDate')}
      </div>
      <div className="form-field">
        <label htmlFor="summary">{copy.summary}</label>
        <textarea
          aria-invalid={Boolean(state.fieldErrors?.summary)}
          id="summary"
          maxLength={320}
          minLength={30}
          name="summary"
          required
          rows={4}
        />
        {fieldError('summary')}
      </div>
      <div className="form-field">
        <label htmlFor="bodyMarkdown">{copy.body}</label>
        <textarea
          aria-invalid={Boolean(state.fieldErrors?.bodyMarkdown)}
          id="bodyMarkdown"
          maxLength={100000}
          minLength={100}
          name="bodyMarkdown"
          required
          rows={20}
        />
        <small>
          {copy.bodyHelp} <code>{'\\cite{court-record}'}</code> {locale === 'vi' ? 'hoặc' : 'or'}{' '}
          <code>{'\\cite{court-record,budget-2025}'}</code>.
        </small>
        {fieldError('bodyMarkdown')}
      </div>
      <div className="form-field">
        <label htmlFor="authors">{copy.authors}</label>
        <input
          aria-invalid={Boolean(state.fieldErrors?.authors)}
          id="authors"
          maxLength={500}
          name="authors"
          type="text"
        />
        <small>{copy.authorsHelp}</small>
        {fieldError('authors')}
      </div>
      <fieldset className="form-fieldset citation-fieldset">
        <legend>{copy.citations}</legend>
        <p className="citation-form-help">{copy.citationHelp}</p>
        <div className="citation-form-rows">
          {citationRows.map((row, index) => (
            <section className="citation-form-row" key={row.id}>
              <div className="citation-form-row-heading">
                <strong>
                  {copy.source} {String(index + 1).padStart(2, '0')}
                </strong>
                {citationRows.length > 1 && (
                  <button type="button" onClick={() => removeCitation(row.id)}>
                    {copy.removeCitation}
                  </button>
                )}
              </div>
              <div className="citation-form-grid">
                <div className="form-field">
                  <label htmlFor={`citationKey-${row.id}`}>{copy.citationKey}</label>
                  <input
                    autoCapitalize="none"
                    id={`citationKey-${row.id}`}
                    maxLength={64}
                    name="citationKey"
                    pattern="[A-Za-z][A-Za-z0-9:_-]{0,63}"
                    placeholder="court-record"
                    required
                    spellCheck={false}
                    type="text"
                  />
                  <small>{copy.citationKeyHelp}</small>
                </div>
                <div className="form-field">
                  <label htmlFor={`citationAccessedAt-${row.id}`}>{copy.accessed}</label>
                  <input
                    id={`citationAccessedAt-${row.id}`}
                    name="citationAccessedAt"
                    required
                    type="date"
                  />
                </div>
                <div className="form-field citation-title-field">
                  <label htmlFor={`citationTitle-${row.id}`}>{copy.citationTitle}</label>
                  <input
                    id={`citationTitle-${row.id}`}
                    maxLength={240}
                    minLength={2}
                    name="citationTitle"
                    required
                    type="text"
                  />
                </div>
                <div className="form-field citation-url-field">
                  <label htmlFor={`citationUrl-${row.id}`}>{copy.citationUrl}</label>
                  <input
                    id={`citationUrl-${row.id}`}
                    name="citationUrl"
                    placeholder="https://"
                    required
                    type="url"
                  />
                </div>
              </div>
            </section>
          ))}
        </div>
        {fieldError('citations')}
        <button className="citation-add-button" type="button" onClick={addCitation}>
          + {copy.addCitation}
        </button>
      </fieldset>
      {state.message && (
        <p className="form-message form-message-error" role="alert">
          {state.message}
        </p>
      )}
      <button className="primary-button" disabled={isPending} type="submit">
        <span>{isPending ? copy.submitting : copy.submit}</span>
        <span aria-hidden="true">→</span>
      </button>
    </form>
  )
}
