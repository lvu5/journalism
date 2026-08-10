import { getPayload, Payload } from 'payload'
import config from '@/payload.config'
import type { Incident, User } from '@/payload-types'

import { describe, it, beforeAll, afterAll, expect } from 'vitest'

let payload: Payload
const marker = Date.now()

describe('Case lifecycle transitions', () => {
  let reviewer: User
  let admin: User
  let incidentId: number

  const incident = () =>
    payload.findByID({ collection: 'incidents', id: incidentId, overrideAccess: true })

  const setStatus = (user: User, caseStatus: Incident['caseStatus']) =>
    payload.update({
      collection: 'incidents',
      id: incidentId,
      user,
      overrideAccess: false,
      data: { caseStatus },
    })

  beforeAll(async () => {
    payload = await getPayload({ config: await config })
    const createUser = (role: 'reviewer' | 'admin', tag: string) =>
      payload.create({
        collection: 'users',
        overrideAccess: true,
        data: {
          email: `lifecycle-${tag}-${marker}@test.local`,
          password: 'test-password-123',
          publicName: `Lifecycle ${tag}`,
          roles: [role],
        },
      }) as Promise<User>
    reviewer = await createUser('reviewer', 'reviewer')
    admin = await createUser('admin', 'admin')

    const created = await payload.create({
      collection: 'incidents',
      user: reviewer,
      overrideAccess: false,
      data: {
        title: `Lifecycle case ${marker}`,
        slug: `lifecycle-case-${marker}`,
        dateStart: new Date().toISOString(),
        summary: 'Integration test case for lifecycle transitions.',
        notabilityReason: 'Created only for automated lifecycle tests.',
        verificationStatus: 'under-review',
        severity: 'low',
        caseStatus: 'newly-opened',
        crowdsourcingEnabled: true,
        citations: [
          {
            sourceTitle: 'Test source',
            url: 'https://example.com/lifecycle-test',
            accessedAt: new Date().toISOString(),
          },
        ],
      },
    })
    incidentId = created.id
  }, 90_000)

  afterAll(async () => {
    if (incidentId)
      await payload.delete({ collection: 'incidents', id: incidentId, overrideAccess: true })
    for (const user of [reviewer, admin]) {
      if (user) await payload.delete({ collection: 'users', id: user.id, overrideAccess: true })
    }
  })

  it('starts as newly-opened and stays a draft for reviewers', async () => {
    const doc = await incident()
    expect(doc.caseStatus).toBe('newly-opened')
    expect(doc._status).toBe('draft')
  })

  it('reviewer moves forward: newly-opened → investigating → accepting-contributions', async () => {
    expect((await setStatus(reviewer, 'investigating')).caseStatus).toBe('investigating')
    expect((await setStatus(reviewer, 'accepting-contributions')).caseStatus).toBe(
      'accepting-contributions',
    )
  })

  it('reviewer cannot move backwards', async () => {
    await expect(setStatus(reviewer, 'newly-opened')).rejects.toThrow(/caseStatus/i)
    expect((await incident()).caseStatus).toBe('accepting-contributions')
  })

  it('reviewer can close, and closing disables crowdsourcing', async () => {
    const closed = await setStatus(reviewer, 'closed')
    expect(closed.caseStatus).toBe('closed')
    expect(closed.crowdsourcingEnabled).toBe(false)
  })

  it('closed is terminal for reviewers but admins can reopen', async () => {
    await expect(setStatus(reviewer, 'investigating')).rejects.toThrow(/caseStatus/i)
    expect((await setStatus(admin, 'reviewing-contributions')).caseStatus).toBe(
      'reviewing-contributions',
    )
  })
})
