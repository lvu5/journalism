import { getPayload, Payload } from 'payload'
import config from '@/payload.config'

import { describe, it, beforeAll, afterAll, expect } from 'vitest'

import {
  initialContributionState,
  submitContribution,
} from '@/app/(frontend)/incidents/[slug]/contribute/actions'

let payload: Payload

const marker = Date.now()
const openSlug = `intake-open-${marker}`
const closedSlug = `intake-closed-${marker}`

let openIncidentId: number
let closedIncidentId: number

const buildFormData = (overrides: Record<string, string> = {}): FormData => {
  const formData = new FormData()
  formData.set('incidentSlug', openSlug)
  formData.set('locale', 'en')
  formData.set('contributionType', 'data-tip')
  formData.set('title', 'A perfectly valid test title')
  formData.set(
    'description',
    'This description is intentionally long enough to pass the minimum length validation.',
  )
  formData.set('contactEmail', `contributor-${marker}@test.local`)
  formData.set('consentToReview', 'on')
  for (const [key, value] of Object.entries(overrides)) formData.set(key, value)
  return formData
}

const countContributions = async (title?: string) => {
  const result = await payload.find({
    collection: 'community-contributions',
    overrideAccess: true,
    where: title ? { title: { equals: title } } : undefined,
  })
  return result.totalDocs
}

describe('Community contribution intake', () => {
  beforeAll(async () => {
    payload = await getPayload({ config: await config })

    const base = {
      dateStart: new Date().toISOString(),
      summary: 'Integration test case for the public intake.',
      notabilityReason: 'Created only for automated intake tests.',
      verificationStatus: 'under-review' as const,
      severity: 'low' as const,
      citations: [
        {
          sourceTitle: 'Test source',
          url: 'https://example.com/intake-test',
          accessedAt: new Date().toISOString(),
        },
      ],
      _status: 'published' as const,
    }

    const open = await payload.create({
      collection: 'incidents',
      overrideAccess: true,
      data: {
        ...base,
        title: `Intake open case ${marker}`,
        slug: openSlug,
        caseStatus: 'accepting-contributions',
        crowdsourcingEnabled: true,
      },
    })
    openIncidentId = open.id

    const closed = await payload.create({
      collection: 'incidents',
      overrideAccess: true,
      data: {
        ...base,
        title: `Intake closed case ${marker}`,
        slug: closedSlug,
        caseStatus: 'closed',
        crowdsourcingEnabled: true,
      },
    })
    closedIncidentId = closed.id
  }, 60_000)

  afterAll(async () => {
    await payload.delete({
      collection: 'community-contributions',
      overrideAccess: true,
      where: { incident: { in: [openIncidentId, closedIncidentId] } },
    })
    await payload.delete({ collection: 'incidents', id: openIncidentId, overrideAccess: true })
    await payload.delete({ collection: 'incidents', id: closedIncidentId, overrideAccess: true })
  })

  it('accepts a valid submission and forces it into the private queue', async () => {
    const result = await submitContribution(initialContributionState, buildFormData())
    expect(result.status).toBe('success')

    const created = await payload.find({
      collection: 'community-contributions',
      overrideAccess: true,
      where: { title: { equals: 'A perfectly valid test title' } },
    })
    expect(created.totalDocs).toBe(1)
    expect(created.docs[0].reviewStatus).toBe('received')
    expect(created.docs[0].publishInCase).toBe(false)
  })

  it('rejects an invalid title with a field-level error', async () => {
    const result = await submitContribution(initialContributionState, buildFormData({ title: 'no' }))
    expect(result.status).toBe('error')
    expect(result.fieldErrors?.title).toBeTruthy()
  })

  it('rejects contributions for a closed case', async () => {
    const result = await submitContribution(
      initialContributionState,
      buildFormData({ incidentSlug: closedSlug }),
    )
    expect(result.status).toBe('error')
    expect(result.message).toMatch(/not currently accepting/i)
  })

  it('blocks raw collection writes (create access is closed)', async () => {
    await expect(
      payload.create({
        collection: 'community-contributions',
        overrideAccess: false,
        data: {
          incident: openIncidentId,
          contributionType: 'other',
          title: 'Raw write attempt',
          description: 'This must never be accepted outside the server action.',
          contactEmail: 'raw@test.local',
          consentToReview: true,
          reviewStatus: 'received',
        },
      }),
    ).rejects.toThrow()
  })

  it('pretends to succeed for honeypot submissions without storing anything', async () => {
    const before = await countContributions()
    const result = await submitContribution(
      initialContributionState,
      buildFormData({ website: 'https://spam.example' }),
    )
    expect(result.status).toBe('success')
    expect(await countContributions()).toBe(before)
  })

  it('rate limits repeated submissions from the same source', async () => {
    // The suite has already consumed part of the shared-IP allowance; fill the
    // rest with distinct emails (the per-email cap is tighter) and expect the
    // next call to be throttled by IP.
    await submitContribution(
      initialContributionState,
      buildFormData({ title: 'Rate fill 1', contactEmail: `rate-1-${marker}@test.local` }),
    )
    const last = await submitContribution(
      initialContributionState,
      buildFormData({ title: 'Rate fill 2', contactEmail: `rate-2-${marker}@test.local` }),
    )
    expect(last.status).toBe('success')

    const blocked = await submitContribution(
      initialContributionState,
      buildFormData({ title: 'Rate limited call', contactEmail: `rate-3-${marker}@test.local` }),
    )
    expect(blocked.status).toBe('error')
    expect(blocked.message).toMatch(/too many submissions/i)
  })
})
