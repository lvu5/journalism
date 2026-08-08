'use client'

import { useActionState } from 'react'

import {
  initialContributionState,
  submitContribution,
} from '@/app/(frontend)/incidents/[slug]/contribute/actions'
import type { Locale } from '@/lib/i18n'

export function ContributionForm({ incidentSlug, locale }: { incidentSlug: string; locale: Locale }) {
  const [state, formAction, isPending] = useActionState(submitContribution, initialContributionState)
  const copy = locale === 'vi' ? {
    type: 'Bạn muốn đóng góp gì?', document: 'Tài liệu hoặc hồ sơ công', eyewitness: 'Lời kể trực tiếp', data: 'Đầu mối dữ liệu', correction: 'Đính chính thông tin', context: 'Bối cảnh bổ sung', other: 'Thông tin khác',
    title: 'Tiêu đề ngắn', titleHelp: 'Tóm tắt điều quan trọng nhất trong 5–180 ký tự.', details: 'Thông tin chi tiết', detailsHelp: 'Mô tả điều bạn biết, cách bạn biết và phần nào cần được kiểm chứng.',
    source: 'Liên kết tài liệu hoặc nguồn (không bắt buộc)', sourceHelp: 'Bản MVP nhận liên kết; chưa nhận tệp đính kèm nhạy cảm.', name: 'Tên hiển thị (không bắt buộc)', email: 'Email liên hệ riêng tư', emailHelp: 'Email không bao giờ được hiển thị công khai.',
    publishName: 'Cho phép hiển thị tên của tôi nếu đóng góp được duyệt.', consent: 'Tôi đồng ý để ban biên tập xem xét, liên hệ và kiểm chứng thông tin này.', sending: 'Đang gửi…', submit: 'Gửi để xem xét',
  } : {
    type: 'What would you like to contribute?', document: 'Document or public record', eyewitness: 'First-hand account', data: 'Data lead', correction: 'Correction', context: 'Additional context', other: 'Other information',
    title: 'Short title', titleHelp: 'Summarize the key point in 5–180 characters.', details: 'Details', detailsHelp: 'Describe what you know, how you know it, and what still needs verification.',
    source: 'Document or source link (optional)', sourceHelp: 'The MVP accepts links and does not yet accept sensitive file uploads.', name: 'Display name (optional)', email: 'Private contact email', emailHelp: 'Your email is never displayed publicly.',
    publishName: 'Allow my name to be shown if this contribution is approved.', consent: 'I agree that the editorial team may review, contact me about, and verify this information.', sending: 'Sending…', submit: 'Submit for review',
  }

  return (
    <form action={formAction} className="contribution-form">
      <input name="incidentSlug" type="hidden" value={incidentSlug} />
      <input name="locale" type="hidden" value={locale} />
      <div className="form-honeypot" aria-hidden="true">
        <label htmlFor="website">Website</label>
        <input autoComplete="off" id="website" name="website" tabIndex={-1} type="text" />
      </div>

      <div className="form-field">
        <label htmlFor="contributionType">{copy.type}</label>
        <select defaultValue="data-tip" id="contributionType" name="contributionType" required>
          <option value="document">{copy.document}</option>
          <option value="eyewitness">{copy.eyewitness}</option>
          <option value="data-tip">{copy.data}</option>
          <option value="correction">{copy.correction}</option>
          <option value="context">{copy.context}</option>
          <option value="other">{copy.other}</option>
        </select>
      </div>

      <div className="form-field">
        <label htmlFor="title">{copy.title}</label>
        <input id="title" maxLength={180} minLength={5} name="title" required type="text" />
        <small>{copy.titleHelp}</small>
      </div>

      <div className="form-field">
        <label htmlFor="description">{copy.details}</label>
        <textarea id="description" maxLength={5000} minLength={30} name="description" required rows={12} />
        <small>{copy.detailsHelp}</small>
      </div>

      <div className="form-field">
        <label htmlFor="sourceUrl">{copy.source}</label>
        <input id="sourceUrl" name="sourceUrl" placeholder="https://" type="url" />
        <small>{copy.sourceHelp}</small>
      </div>

      <div className="form-grid">
        <div className="form-field">
          <label htmlFor="contributorName">{copy.name}</label>
          <input id="contributorName" maxLength={100} name="contributorName" type="text" />
        </div>
        <div className="form-field">
          <label htmlFor="contactEmail">{copy.email}</label>
          <input autoComplete="email" id="contactEmail" name="contactEmail" required type="email" />
          <small>{copy.emailHelp}</small>
        </div>
      </div>

      <label className="form-checkbox">
        <input name="publishName" type="checkbox" />
        <span>{copy.publishName}</span>
      </label>
      <label className="form-checkbox">
        <input name="consentToReview" required type="checkbox" />
        <span>{copy.consent}</span>
      </label>

      {state.message && (
        <p className={`form-message form-message-${state.status}`} role="status">{state.message}</p>
      )}

      <button className="primary-button" disabled={isPending} type="submit">
        <span>{isPending ? copy.sending : copy.submit}</span>
        <span aria-hidden="true">→</span>
      </button>
    </form>
  )
}
