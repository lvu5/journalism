// @vitest-environment node
import { getPayload, Payload } from 'payload'
import config from '@/payload.config'
import type { User } from '@/payload-types'

import { describe, it, beforeAll, afterAll, expect } from 'vitest'

import * as tui from '@/tui/api'

let payload: Payload
const marker = Date.now()

describe('TUI logic layer', () => {
  let reviewer: User
  let author: User
  let deactivated: User
  let incidentId: number
  let pendingId: number
  let approvedId: number

  beforeAll(async () => {
    payload = await getPayload({ config: await config })

    const createUser = (roles: Array<'admin' | 'reviewer' | 'author'>, tag: string, active = true) =>
      payload.create({
        collection: 'users',
        overrideAccess: true,
        data: {
          email: `tui-${tag}-${marker}@test.local`,
          password: 'test-password-123',
          publicName: `TUI ${tag}`,
          roles,
          active,
        },
      }) as Promise<User>

    reviewer = await createUser(['reviewer'], 'reviewer')
    author = await createUser(['author'], 'author')
    deactivated = await createUser(['reviewer'], 'deactivated', false)

    const incident = await payload.create({
      collection: 'incidents',
      overrideAccess: true,
      data: {
        title: `TUI case ${marker}`,
        slug: `tui-case-${marker}`,
        dateStart: new Date().toISOString(),
        summary: 'Integration test case for the TUI logic layer.',
        notabilityReason: 'Created only for automated TUI tests.',
        caseStatus: 'accepting-contributions',
        crowdsourcingEnabled: true,
        verificationStatus: 'under-review',
        severity: 'low',
        citations: [
          {
            sourceTitle: 'Test source',
            url: 'https://example.com/tui-test',
            accessedAt: new Date().toISOString(),
          },
        ],
        _status: 'published',
      },
    })
    incidentId = incident.id

    const contributionData = {
      incident: incidentId,
      contributionType: 'data-tip' as const,
      description: 'A contribution created for TUI integration testing purposes.',
      contactEmail: `tui-source-${marker}@test.local`,
      consentToReview: true,
    }
    const pending = await payload.create({
      collection: 'community-contributions',
      overrideAccess: true,
      data: { ...contributionData, title: `TUI pending ${marker}`, reviewStatus: 'received' },
    })
    pendingId = pending.id
    const approved = await payload.create({
      collection: 'community-contributions',
      overrideAccess: true,
      data: { ...contributionData, title: `TUI approved ${marker}`, reviewStatus: 'approved' },
    })
    approvedId = approved.id
    // Creates are forced to 'received' by the collection hook — approve
    // through the real workflow to get a genuinely approved document.
    await payload.update({
      collection: 'community-contributions',
      id: approvedId,
      overrideAccess: true,
      data: { reviewStatus: 'approved' },
    })
  }, 90_000)

  afterAll(async () => {
    await payload.delete({
      collection: 'audit-logs',
      overrideAccess: true,
      where: { targetId: { in: [String(pendingId), String(approvedId)] } },
    })
    await payload.delete({ collection: 'community-contributions', id: pendingId, overrideAccess: true })
    await payload.delete({ collection: 'community-contributions', id: approvedId, overrideAccess: true })
    await payload.delete({ collection: 'incidents', id: incidentId, overrideAccess: true })
    for (const user of [reviewer, author, deactivated]) {
      if (user) await payload.delete({ collection: 'users', id: user.id, overrideAccess: true })
    }
  })

  it('logs in active staff and rejects deactivated staff', async () => {
    const user = await tui.login(`tui-reviewer-${marker}@test.local`, 'test-password-123')
    expect(user.publicName).toBe('TUI reviewer')
    await expect(
      tui.login(`tui-deactivated-${marker}@test.local`, 'test-password-123'),
    ).rejects.toThrow(/deactivated/i)
    await expect(
      tui.login(`tui-reviewer-${marker}@test.local`, 'wrong-password'),
    ).rejects.toThrow()
  })

  it('gates triage to reviewers and admins', () => {
    expect(tui.canTriage(reviewer)).toBe(true)
    expect(tui.canTriage(author)).toBe(false)
  })

  it('returns only pending items by default, with the case title resolved', async () => {
    const queue = await tui.fetchQueue(reviewer)
    const ids = queue.map((item) => item.id)
    expect(ids).toContain(pendingId)
    expect(ids).not.toContain(approvedId)
    expect(queue.find((item) => item.id === pendingId)?.incidentTitle).toBe(`TUI case ${marker}`)
  })

  it('authors cannot read the queue at all (role gate + collection access)', async () => {
    await expect(tui.fetchQueue(author)).rejects.toThrow(/reviewers and admins/i)
  })

  it('status decisions stamp the reviewer and write an audit row', async () => {
    const updated = await tui.setReviewStatus(reviewer, pendingId, 'screening')
    expect(updated.reviewStatus).toBe('screening')

    const logs = await payload.find({
      collection: 'audit-logs',
      overrideAccess: true,
      where: {
        and: [
          { targetId: { equals: String(pendingId) } },
          { action: { equals: 'contribution-status-change' } },
        ],
      },
    })
    expect(logs.totalDocs).toBeGreaterThan(0)
    expect(logs.docs[0].details).toContain('screening')
  })

  it('refuses to publish unapproved contributions, then allows it after approval', async () => {
    await expect(tui.setPublishInCase(reviewer, pendingId, true)).rejects.toThrow(/approved/i)
    await tui.setReviewStatus(reviewer, pendingId, 'approved')
    const published = await tui.setPublishInCase(reviewer, pendingId, true)
    expect(published.publishInCase).toBe(true)
  })

  it('saves private reviewer notes', async () => {
    const updated = await tui.saveReviewerNotes(reviewer, pendingId, 'Verified against the registry.')
    expect(updated.reviewerNotes).toBe('Verified against the registry.')
  })
})
