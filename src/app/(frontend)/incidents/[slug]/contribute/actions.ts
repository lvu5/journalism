'use server'

import config from '@payload-config'
import { getPayload } from 'payload'

export type ContributionFormState = {
  status: 'idle' | 'success' | 'error'
  message: string
}

export const initialContributionState: ContributionFormState = { status: 'idle', message: '' }

const contributionTypes = [
  'document',
  'eyewitness',
  'data-tip',
  'correction',
  'context',
  'other',
] as const

const valueOf = (formData: FormData, name: string) => {
  const value = formData.get(name)
  return typeof value === 'string' ? value.trim() : ''
}

const validHttpUrl = (value: string) => {
  try {
    const url = new URL(value)
    return url.protocol === 'http:' || url.protocol === 'https:'
  } catch {
    return false
  }
}

export async function submitContribution(
  _previousState: ContributionFormState,
  formData: FormData,
): Promise<ContributionFormState> {
  const locale = valueOf(formData, 'locale') === 'en' ? 'en' : 'vi'
  const message = (vi: string, en: string) => (locale === 'vi' ? vi : en)
  const honeypot = valueOf(formData, 'website')
  if (honeypot) {
    return { status: 'success', message: message('Cảm ơn bạn. Thông tin đã được tiếp nhận.', 'Thank you. Your information has been received.') }
  }

  const incidentSlug = valueOf(formData, 'incidentSlug')
  const contributionType = valueOf(formData, 'contributionType')
  const title = valueOf(formData, 'title')
  const description = valueOf(formData, 'description')
  const sourceUrl = valueOf(formData, 'sourceUrl')
  const contributorName = valueOf(formData, 'contributorName')
  const contactEmail = valueOf(formData, 'contactEmail').toLowerCase()
  const publishName = formData.get('publishName') === 'on'
  const consentToReview = formData.get('consentToReview') === 'on'

  if (!incidentSlug || !contributionTypes.includes(contributionType as (typeof contributionTypes)[number])) {
    return { status: 'error', message: message('Loại đóng góp hoặc hồ sơ không hợp lệ.', 'The contribution type or case is invalid.') }
  }
  if (title.length < 5 || title.length > 180) {
    return { status: 'error', message: message('Tiêu đề cần từ 5 đến 180 ký tự.', 'The title must be between 5 and 180 characters.') }
  }
  if (description.length < 30 || description.length > 5000) {
    return { status: 'error', message: message('Nội dung cần từ 30 đến 5.000 ký tự.', 'The contribution must be between 30 and 5,000 characters.') }
  }
  if (contributorName.length > 100) {
    return { status: 'error', message: message('Tên người đóng góp không được dài quá 100 ký tự.', 'The contributor name cannot exceed 100 characters.') }
  }
  if (!/^\S+@\S+\.\S+$/.test(contactEmail)) {
    return { status: 'error', message: message('Vui lòng nhập một địa chỉ email hợp lệ.', 'Enter a valid email address.') }
  }
  if (sourceUrl && !validHttpUrl(sourceUrl)) {
    return { status: 'error', message: message('Liên kết nguồn phải bắt đầu bằng http:// hoặc https://.', 'The source link must begin with http:// or https://.') }
  }
  if (!consentToReview) {
    return { status: 'error', message: message('Bạn cần xác nhận để ban biên tập có thể xem xét thông tin.', 'You must consent before the editorial team can review this information.') }
  }

  try {
    const payload = await getPayload({ config })
    const incidents = await payload.find({
      collection: 'incidents',
      depth: 0,
      limit: 1,
      overrideAccess: false,
      where: { slug: { equals: incidentSlug } },
    })
    const incident = incidents.docs[0]

    if (!incident || !incident.crowdsourcingEnabled || incident.caseStatus === 'closed') {
      return { status: 'error', message: message('Hồ sơ này hiện không nhận thêm đóng góp.', 'This case is not currently accepting contributions.') }
    }

    // This server action is the trusted public intake boundary. Collection access blocks raw API writes.
    await payload.create({
      collection: 'community-contributions',
      overrideAccess: true,
      data: {
        incident: incident.id,
        contributionType: contributionType as (typeof contributionTypes)[number],
        title,
        description,
        sourceUrl: sourceUrl || undefined,
        contributorName: contributorName || undefined,
        contactEmail,
        publishName,
        consentToReview,
        reviewStatus: 'received',
        publishInCase: false,
      },
    })

    return {
      status: 'success',
      message: message('Đã tiếp nhận. Ban biên tập sẽ sàng lọc và xác minh trước khi công bố.', 'Received. The editorial team will screen and verify the information before publication.'),
    }
  } catch {
    return {
      status: 'error',
      message: message('Chưa thể gửi thông tin lúc này. Vui lòng thử lại sau.', 'The information could not be submitted. Please try again later.'),
    }
  }
}
