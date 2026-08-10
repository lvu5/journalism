// @vitest-environment node
import { getPayload, Payload } from 'payload'
import { sql } from '@payloadcms/db-postgres'
import config from '@/payload.config'
import type { User } from '@/payload-types'

import { describe, it, beforeAll, afterAll, expect } from 'vitest'

import { decryptField, encryptField, isEncrypted, tryDecryptField } from '@/lib/field-crypto'

describe('field crypto', () => {
  it('round-trips values through AES-256-GCM', () => {
    const encrypted = encryptField('source@example.org')
    expect(isEncrypted(encrypted)).toBe(true)
    expect(encrypted).not.toContain('source@example.org')
    expect(decryptField(encrypted)).toBe('source@example.org')
  })

  it('is idempotent and fails soft on tampered ciphertext', () => {
    const encrypted = encryptField('a@b.c')
    expect(encryptField(encrypted)).toBe(encrypted)
    // Read paths never 500 on bad rows — placeholder + log instead.
    expect(decryptField(`${encrypted.slice(0, -4)}AAAA`)).toBe('[undecryptable]')
    // Validation paths get a strict null.
    expect(tryDecryptField(`${encrypted.slice(0, -4)}AAAA`)).toBeNull()
    expect(tryDecryptField('not-encrypted@example.org')).toBeNull()
  })
})

describe('source protection', () => {
  let payload: Payload
  let reviewer: User
  let incidentId: number
  let contributionId: number
  const marker = Date.now()
  const email = `whistleblower-${marker}@example.org`

  beforeAll(async () => {
    payload = await getPayload({ config: await config })
    reviewer = (await payload.create({
      collection: 'users',
      overrideAccess: true,
      data: {
        email: `crypto-reviewer-${marker}@test.local`,
        password: 'test-password-123',
        publicName: 'Crypto Reviewer',
        roles: ['reviewer'],
      },
    })) as User

    const incident = await payload.create({
      collection: 'incidents',
      overrideAccess: true,
      data: {
        title: `Crypto case ${marker}`,
        slug: `crypto-case-${marker}`,
        dateStart: new Date().toISOString(),
        summary: 'Integration test case for source protection.',
        notabilityReason: 'Created only for automated crypto tests.',
        caseStatus: 'accepting-contributions',
        crowdsourcingEnabled: true,
        verificationStatus: 'under-review',
        severity: 'low',
        citations: [
          {
            sourceTitle: 'Test source',
            url: 'https://example.com/crypto-test',
            accessedAt: new Date().toISOString(),
          },
        ],
        _status: 'published',
      },
    })
    incidentId = incident.id

    const contribution = await payload.create({
      collection: 'community-contributions',
      overrideAccess: true,
      data: {
        incident: incidentId,
        contributionType: 'document',
        title: `Crypto contribution ${marker}`,
        description: 'Evidence submitted by a source that needs protection.',
        contactEmail: email,
        consentToReview: true,
        reviewStatus: 'received',
        publishInCase: false,
      },
    })
    contributionId = contribution.id
  }, 90_000)

  afterAll(async () => {
    await payload.delete({
      collection: 'audit-logs',
      overrideAccess: true,
      where: { targetId: { equals: String(contributionId) } },
    }).catch(() => undefined)
    await payload.delete({
      collection: 'community-contributions',
      id: contributionId,
      overrideAccess: true,
    })
    await payload.delete({ collection: 'incidents', id: incidentId, overrideAccess: true })
    if (reviewer) await payload.delete({ collection: 'users', id: reviewer.id, overrideAccess: true })
  })

  it('stores the contact email encrypted at rest', async () => {
    const result = await payload.db.drizzle.execute(
      sql`SELECT contact_email FROM community_contributions WHERE id = ${contributionId}`,
    )
    const stored = result.rows[0]?.contact_email as string
    expect(stored).toMatch(/^enc:v1:/)
    expect(stored).not.toContain(email)
  })

  it('reviewers read the decrypted email', async () => {
    const doc = await payload.findByID({
      collection: 'community-contributions',
      id: contributionId,
      user: reviewer,
      overrideAccess: false,
    })
    expect(doc.contactEmail).toBe(email)
  })

  it('logs single-document PII reads by staff', async () => {
    const before = await payload.find({
      collection: 'audit-logs',
      overrideAccess: true,
      where: {
        and: [{ targetId: { equals: String(contributionId) } }, { action: { equals: 'pii-read' } }],
      },
    })
    await payload.findByID({
      collection: 'community-contributions',
      id: contributionId,
      user: reviewer,
      overrideAccess: false,
    })
    const after = await payload.find({
      collection: 'audit-logs',
      overrideAccess: true,
      where: {
        and: [{ targetId: { equals: String(contributionId) } }, { action: { equals: 'pii-read' } }],
      },
    })
    expect(after.totalDocs).toBe(before.totalDocs + 1)
  })

  it('does not log a PII read for the read echo after an update', async () => {
    const before = await payload.find({
      collection: 'audit-logs',
      overrideAccess: true,
      where: {
        and: [{ targetId: { equals: String(contributionId) } }, { action: { equals: 'pii-read' } }],
      },
    })
    await payload.update({
      collection: 'community-contributions',
      id: contributionId,
      user: reviewer,
      overrideAccess: false,
      data: { reviewStatus: 'needs-info' },
    })
    const after = await payload.find({
      collection: 'audit-logs',
      overrideAccess: true,
      where: {
        and: [{ targetId: { equals: String(contributionId) } }, { action: { equals: 'pii-read' } }],
      },
    })
    expect(after.totalDocs).toBe(before.totalDocs)
  })

  it('logs review status changes', async () => {
    await payload.update({
      collection: 'community-contributions',
      id: contributionId,
      user: reviewer,
      overrideAccess: false,
      data: { reviewStatus: 'screening' },
    })
    const logs = await payload.find({
      collection: 'audit-logs',
      overrideAccess: true,
      where: {
        and: [
          { targetId: { equals: String(contributionId) } },
          { action: { equals: 'contribution-status-change' } },
        ],
      },
    })
    expect(logs.totalDocs).toBeGreaterThan(0)
    expect(logs.docs.some((log) => log.details?.includes('received'))).toBe(true)
  })

  it('audit logs cannot be created, edited, or deleted via the API', async () => {
    await expect(
      payload.create({
        collection: 'audit-logs',
        overrideAccess: false,
        user: reviewer,
        data: { action: 'pii-read', targetCollection: 'x', targetId: '1' },
      }),
    ).rejects.toThrow()
    await expect(
      payload.delete({
        collection: 'audit-logs',
        overrideAccess: false,
        where: { id: { equals: 0 } },
      }),
    ).rejects.toThrow()
  })
})
