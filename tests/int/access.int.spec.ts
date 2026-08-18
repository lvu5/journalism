// @vitest-environment node
// (Upload type detection via file-type needs real Buffers — jsdom breaks it.)
import { getPayload, Payload } from 'payload'
import config from '@/payload.config'
import type { User } from '@/payload-types'

import { describe, it, beforeAll, afterAll, expect } from 'vitest'

let payload: Payload
const marker = Date.now()

describe('Collection access control', () => {
  let reviewer: User
  let reviewer2: User
  let author: User
  let draftIncidentId: number
  let publishedIncidentId: number
  let privateMediaId: number
  let publicMediaId: number
  let articleId: number
  let reviewId: number | undefined

  beforeAll(async () => {
    payload = await getPayload({ config: await config })

    const createUser = (role: 'reviewer' | 'author', tag: string) =>
      payload.create({
        collection: 'users',
        overrideAccess: true,
        data: {
          email: `${tag}-${marker}@test.local`,
          password: 'test-password-123',
          publicName: `Access ${tag}`,
          roles: [role],
        },
      }) as Promise<User>

    reviewer = await createUser('reviewer', 'reviewer')
    reviewer2 = await createUser('reviewer', 'reviewer2')
    author = await createUser('author', 'author')

    const incidentBase = {
      dateStart: new Date().toISOString(),
      summary: 'Access-control test case.',
      notabilityReason: 'Created only for automated access tests.',
      verificationStatus: 'under-review' as const,
      severity: 'low' as const,
      citations: [
        {
          sourceTitle: 'Test source',
          url: 'https://example.com/access-test',
          accessedAt: new Date().toISOString(),
        },
      ],
    }

    const draftIncident = await payload.create({
      collection: 'incidents',
      overrideAccess: true,
      data: {
        ...incidentBase,
        title: `Draft case ${marker}`,
        slug: `draft-case-${marker}`,
        caseStatus: 'newly-opened',
        _status: 'draft',
      },
    })
    draftIncidentId = draftIncident.id

    const publishedIncident = await payload.create({
      collection: 'incidents',
      overrideAccess: true,
      data: {
        ...incidentBase,
        title: `Published case ${marker}`,
        slug: `published-case-${marker}`,
        caseStatus: 'investigating',
        _status: 'published',
      },
    })
    publishedIncidentId = publishedIncident.id

    const mediaBase = { alt: 'access test image' }
    const privateMedia = await payload.create({
      collection: 'media',
      overrideAccess: true,
      data: { ...mediaBase, visibility: 'private' },
      filePath: 'tests/helpers/fixtures/tiny.png',
    })
    privateMediaId = privateMedia.id

    const publicMedia = await payload.create({
      collection: 'media',
      overrideAccess: true,
      data: { ...mediaBase, visibility: 'public' },
      filePath: 'tests/helpers/fixtures/tiny.png',
    })
    publicMediaId = publicMedia.id

    // A submitted article by the author, ready for review.
    const article = await payload.create({
      collection: 'articles',
      user: author,
      overrideAccess: false,
      data: {
        title: `Reviewable article ${marker}`,
        slug: `reviewable-${marker}`,
        eventDate: new Date().toISOString(),
        summary: 'Article used to test review access rules.',
        bodyMarkdown: 'Body long enough for the required field.',
        citations: [
          {
            citationKey: 'review-test',
            sourceTitle: 'Test source',
            url: 'https://example.com/review-test',
            accessedAt: new Date().toISOString(),
          },
        ],
        workflowStatus: 'draft',
      },
    })
    articleId = article.id
    await payload.update({
      collection: 'articles',
      id: articleId,
      user: author,
      overrideAccess: false,
      data: { workflowStatus: 'submitted' },
    })
  }, 90_000)

  afterAll(async () => {
    if (reviewId) {
      await payload.delete({ collection: 'reviews', id: reviewId, overrideAccess: true })
    }
    if (articleId)
      await payload.delete({ collection: 'articles', id: articleId, overrideAccess: true })
    if (privateMediaId)
      await payload.delete({ collection: 'media', id: privateMediaId, overrideAccess: true })
    if (publicMediaId)
      await payload.delete({ collection: 'media', id: publicMediaId, overrideAccess: true })
    await payload.delete({ collection: 'incidents', id: draftIncidentId, overrideAccess: true })
    await payload.delete({ collection: 'incidents', id: publishedIncidentId, overrideAccess: true })
    for (const user of [reviewer, reviewer2, author]) {
      if (user) await payload.delete({ collection: 'users', id: user.id, overrideAccess: true })
    }
  })

  it('anonymous users cannot list staff accounts', async () => {
    // users.read returns false for anonymous requests — a hard Forbidden.
    await expect(payload.find({ collection: 'users', overrideAccess: false })).rejects.toThrow(
      /not allowed/i,
    )
  })

  it('anonymous readers only see published cases', async () => {
    const result = await payload.find({
      collection: 'incidents',
      overrideAccess: false,
      where: { id: { in: [draftIncidentId, publishedIncidentId] } },
    })
    expect(result.totalDocs).toBe(1)
    expect(result.docs[0].id).toBe(publishedIncidentId)
  })

  it('anonymous readers only see public media', async () => {
    const result = await payload.find({
      collection: 'media',
      overrideAccess: false,
      where: { id: { in: [privateMediaId, publicMediaId] } },
    })
    expect(result.totalDocs).toBe(1)
    expect(result.docs[0].id).toBe(publicMediaId)
  })

  it('reviewers cannot review their own submissions', async () => {
    // Reviewers write under the same account, so create and submit as the reviewer.
    const ownArticle = await payload.create({
      collection: 'articles',
      user: reviewer,
      overrideAccess: false,
      data: {
        title: `Reviewer own article ${marker}`,
        slug: `self-review-${marker}`,
        eventDate: new Date().toISOString(),
        summary: 'Written and submitted by the reviewer.',
        bodyMarkdown: 'Body long enough for the required field.',
        citations: [
          {
            citationKey: 'self-review-test',
            sourceTitle: 'Test source',
            url: 'https://example.com/self-review-test',
            accessedAt: new Date().toISOString(),
          },
        ],
        workflowStatus: 'submitted',
      },
    })

    await expect(
      payload.create({
        collection: 'reviews',
        user: reviewer,
        overrideAccess: false,
        data: {
          article: ownArticle.id,
          decision: 'approve',
          comments: 'Self approval attempt.',
          reviewer: reviewer.id,
        },
      }),
    ).rejects.toThrow(/article/i)

    await payload.delete({ collection: 'articles', id: ownArticle.id, overrideAccess: true })
  })

  it('a second reviewer can approve, syncing the article workflow status', async () => {
    const review = await payload.create({
      collection: 'reviews',
      user: reviewer2,
      overrideAccess: false,
      data: {
        article: articleId,
        decision: 'approve',
        comments: 'Looks good, verified against the primary source.',
        reviewer: reviewer2.id,
      },
    })
    reviewId = review.id

    const article = await payload.findByID({
      collection: 'articles',
      id: articleId,
      overrideAccess: true,
    })
    expect(article.workflowStatus).toBe('approved')
    expect(article._status).toBe('draft') // only admins publish
  })

  it('deactivated users cannot log in', async () => {
    const email = `deactivated-${marker}@test.local`
    const user = (await payload.create({
      collection: 'users',
      overrideAccess: true,
      data: {
        email,
        password: 'test-password-123',
        publicName: 'Deactivated Author',
        roles: ['author'],
      },
    })) as User

    try {
      const login = await payload.login({
        collection: 'users',
        data: { email, password: 'test-password-123' },
      })
      expect(login.user?.email).toBe(email)

      await payload.update({
        collection: 'users',
        id: user.id,
        overrideAccess: true,
        data: { active: false },
      })

      await expect(
        payload.login({ collection: 'users', data: { email, password: 'test-password-123' } }),
      ).rejects.toThrow(/deactivated/i)
    } finally {
      await payload.delete({ collection: 'users', id: user.id, overrideAccess: true })
    }
  })
})
