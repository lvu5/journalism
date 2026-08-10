'use server'

import config from '@payload-config'
import { headers } from 'next/headers'
import { getPayload } from 'payload'

// Simple per-instance sliding-window throttle for the public intake. This is
// intentionally modest: it stops scripted floods from a single source without
// blocking a busy shared network (cafés, offices, carrier NAT). Deployments
// with multiple instances need a shared store (Redis/KV) instead — see #1.
const RATE_WINDOW_MS = 10 * 60 * 1000
const RATE_MAX_PER_IP = 5
const RATE_MAX_PER_EMAIL = 3

// Only trust X-Forwarded-For when a proxy we control appends it
// (TRUSTED_PROXY=true). Otherwise all direct traffic shares one honest
// bucket instead of trusting a client-spoofable header.
const TRUSTED_PROXY = process.env.TRUSTED_PROXY === 'true'

const attempts = new Map<string, number[]>()
let lastSweep = 0

const rateLimited = (key: string, max: number): boolean => {
  const now = Date.now()
  // Full sweep periodically and whenever the map grows — stale keys can never
  // accumulate, and in-window floods cannot grow it unbounded.
  if (now - lastSweep > RATE_WINDOW_MS || attempts.size > 500) {
    for (const [k, ts] of attempts) {
      const fresh = ts.filter((t) => now - t < RATE_WINDOW_MS)
      if (fresh.length) attempts.set(k, fresh)
      else attempts.delete(k)
    }
    lastSweep = now
  }
  const timestamps = attempts.get(key) || []
  if (timestamps.length >= max) return true
  timestamps.push(now)
  attempts.set(key, timestamps)
  return false
}

// The IP key is honest by construction: without a trusted proxy we cannot
// know the client address at all, so all direct traffic shares one bucket.
const clientIp = async (): Promise<string> => {
  try {
    const requestHeaders = await headers()
    if (!TRUSTED_PROXY) return 'direct'
    // With a proxy that appends (proxy_add_x_forwarded_for), the rightmost
    // hop is the one our proxy added; anything to its left is client input.
    return requestHeaders.get('x-forwarded-for')?.split(',').at(-1)?.trim() || 'direct'
  } catch {
    // Non-request context (integration tests, scripts).
    return 'direct'
  }
}

export type ContributionField =
  | 'consentToReview'
  | 'contactEmail'
  | 'contributionType'
  | 'contributorName'
  | 'description'
  | 'sourceUrl'
  | 'title'

export type ContributionFormState = {
  status: 'idle' | 'success' | 'error'
  message: string
  fieldErrors?: Partial<Record<ContributionField, string>>
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
    return {
      status: 'error',
      message: message('Loại đóng góp hoặc hồ sơ không hợp lệ.', 'The contribution type or case is invalid.'),
      fieldErrors: { contributionType: message('Loại đóng góp hoặc hồ sơ không hợp lệ.', 'The contribution type or case is invalid.') },
    }
  }
  if (title.length < 5 || title.length > 180) {
    return {
      status: 'error',
      message: message('Tiêu đề cần từ 5 đến 180 ký tự.', 'The title must be between 5 and 180 characters.'),
      fieldErrors: { title: message('Tiêu đề cần từ 5 đến 180 ký tự.', 'The title must be between 5 and 180 characters.') },
    }
  }
  if (description.length < 30 || description.length > 5000) {
    return {
      status: 'error',
      message: message('Nội dung cần từ 30 đến 5.000 ký tự.', 'The contribution must be between 30 and 5,000 characters.'),
      fieldErrors: { description: message('Nội dung cần từ 30 đến 5.000 ký tự.', 'The contribution must be between 30 and 5,000 characters.') },
    }
  }
  if (contributorName.length > 100) {
    return {
      status: 'error',
      message: message('Tên người đóng góp không được dài quá 100 ký tự.', 'The contributor name cannot exceed 100 characters.'),
      fieldErrors: { contributorName: message('Tên người đóng góp không được dài quá 100 ký tự.', 'The contributor name cannot exceed 100 characters.') },
    }
  }
  if (!/^\S+@\S+\.\S+$/.test(contactEmail)) {
    return {
      status: 'error',
      message: message('Vui lòng nhập một địa chỉ email hợp lệ.', 'Enter a valid email address.'),
      fieldErrors: { contactEmail: message('Vui lòng nhập một địa chỉ email hợp lệ.', 'Enter a valid email address.') },
    }
  }
  if (sourceUrl && !validHttpUrl(sourceUrl)) {
    return {
      status: 'error',
      message: message('Liên kết nguồn phải bắt đầu bằng http:// hoặc https://.', 'The source link must begin with http:// or https://.'),
      fieldErrors: { sourceUrl: message('Liên kết nguồn phải bắt đầu bằng http:// hoặc https://.', 'The source link must begin with http:// or https://.') },
    }
  }
  if (!consentToReview) {
    return {
      status: 'error',
      message: message('Bạn cần xác nhận để ban biên tập có thể xem xét thông tin.', 'You must consent before the editorial team can review this information.'),
      fieldErrors: { consentToReview: message('Bạn cần xác nhận để ban biên tập có thể xem xét thông tin.', 'You must consent before the editorial team can review this information.') },
    }
  }

  // Rate limiting runs after validation so form mistakes never consume quota,
  // but before any database work so floods stay cheap.
  const ip = await clientIp()
  if (
    rateLimited(`ip:${ip}`, RATE_MAX_PER_IP) ||
    rateLimited(`email:${contactEmail}`, RATE_MAX_PER_EMAIL)
  ) {
    return {
      status: 'error',
      message: message(
        'Bạn đã gửi quá nhiều lần trong thời gian ngắn. Vui lòng thử lại sau ít phút.',
        'Too many submissions in a short time. Please try again in a few minutes.',
      ),
    }
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
  } catch (error) {
    console.error('[contribute] submission failed', error)
    return {
      status: 'error',
      message: message('Chưa thể gửi thông tin lúc này. Vui lòng thử lại sau.', 'The information could not be submitted. Please try again later.'),
    }
  }
}
