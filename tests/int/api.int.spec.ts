import { getPayload, Payload } from 'payload'
import config from '@/payload.config'

import { describe, it, beforeAll, expect } from 'vitest'

let payload: Payload

describe('API', () => {
  beforeAll(async () => {
    const payloadConfig = await config
    payload = await getPayload({ config: payloadConfig })
  })

  it('fetches users', async () => {
    const users = await payload.find({
      collection: 'users',
    })
    expect(users).toBeDefined()
  })

  it('keeps private community contribution fields out of public reads', async () => {
    const marker = Date.now()
    const incident = await payload.create({
      collection: 'incidents',
      overrideAccess: true,
      data: {
        title: `Privacy test case ${marker}`,
        slug: `privacy-test-case-${marker}`,
        dateStart: new Date().toISOString(),
        summary: 'Temporary integration-test case for validating contribution field privacy.',
        notabilityReason: 'Created only for an automated access-control test.',
        caseStatus: 'accepting-contributions',
        crowdsourcingEnabled: true,
        verificationStatus: 'under-review',
        severity: 'low',
        citations: [
          {
            sourceTitle: 'Automated test source',
            url: 'https://example.com/access-control-test',
            accessedAt: new Date().toISOString(),
          },
        ],
        _status: 'published',
      },
    })
    const contribution = await payload.create({
      collection: 'community-contributions',
      overrideAccess: true,
      data: {
        incident: incident.id,
        contributionType: 'document',
        title: 'Approved public contribution',
        description: 'This public description is long enough for the contribution validation rules.',
        contributorName: 'Public test name',
        contactEmail: 'private@example.com',
        publishName: true,
        consentToReview: true,
        reviewStatus: 'received',
        publishInCase: false,
        reviewerNotes: 'This note must remain private.',
      },
    })

    try {
      await payload.update({
        collection: 'community-contributions',
        id: contribution.id,
        overrideAccess: true,
        data: { reviewStatus: 'approved', publishInCase: true },
      })
      const contributions = await payload.find({
        collection: 'community-contributions',
        overrideAccess: false,
        where: { id: { equals: contribution.id } },
      })
      const publicContribution = contributions.docs[0] as unknown as Record<string, unknown>

      expect(publicContribution).toBeDefined()
      expect(publicContribution.contributorName).toBe('Public test name')
      expect('contactEmail' in publicContribution).toBe(false)
      expect('reviewerNotes' in publicContribution).toBe(false)
      expect('reviewStatus' in publicContribution).toBe(false)
    } finally {
      await payload.delete({
        collection: 'community-contributions',
        id: contribution.id,
        overrideAccess: true,
      })
      await payload.delete({ collection: 'incidents', id: incident.id, overrideAccess: true })
    }
  })
})
