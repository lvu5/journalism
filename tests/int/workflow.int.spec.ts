import { getPayload, Payload } from 'payload'
import config from '@/payload.config'
import type { User } from '@/payload-types'

import { describe, it, beforeAll, afterAll, expect } from 'vitest'

let payload: Payload

const marker = Date.now()

const createUser = (role: 'admin' | 'reviewer' | 'author', tag: string) =>
  payload.create({
    collection: 'users',
    overrideAccess: true,
    data: {
      email: `${tag}-${marker}@test.local`,
      password: 'test-password-123',
      publicName: `Test ${tag}`,
      roles: [role],
    },
  })

const articleData = {
  title: `Workflow test article ${marker}`,
  slug: `workflow-test-${marker}`,
  eventDate: new Date().toISOString(),
  summary: 'Integration test article for the editorial workflow.',
  bodyMarkdown: 'This body exists to satisfy the required Markdown field.',
  citations: [
    {
      sourceTitle: 'Test source',
      url: 'https://example.com/workflow-test',
      accessedAt: new Date().toISOString(),
    },
  ],
  workflowStatus: 'draft' as const,
}

describe('Editorial workflow', () => {
  let author: User
  let reviewer: User
  let admin: User
  let articleId: number

  beforeAll(async () => {
    payload = await getPayload({ config: await config })
    author = await createUser('author', 'author') as User
    reviewer = await createUser('reviewer', 'reviewer') as User
    admin = await createUser('admin', 'admin') as User
  }, 60_000)

  afterAll(async () => {
    for (const user of [author, reviewer, admin]) {
      if (user) await payload.delete({ collection: 'users', id: user.id, overrideAccess: true })
    }
  })

  it('author creates a draft and becomes the submitter', async () => {
    const article = await payload.create({
      collection: 'articles',
      user: author,
      overrideAccess: false,
      data: articleData,
    })
    articleId = article.id
    expect(article.workflowStatus).toBe('draft')
    expect(article._status).toBe('draft')
    expect(typeof article.submittedBy === 'object' ? article.submittedBy?.id : article.submittedBy).toBe(author.id)
  })

  it('author can submit their own draft', async () => {
    const article = await payload.update({
      collection: 'articles',
      id: articleId,
      user: author,
      overrideAccess: false,
      data: { workflowStatus: 'submitted' },
    })
    expect(article.workflowStatus).toBe('submitted')
    expect(article._status).toBe('draft')
  })

  it('author cannot edit the article after submitting', async () => {
    await expect(
      payload.update({
        collection: 'articles',
        id: articleId,
        user: author,
        overrideAccess: false,
        data: { title: 'Edited after submit' },
      }),
      // Payload surfaces hook ValidationErrors as "The following field is invalid: workflowStatus"
    ).rejects.toThrow(/workflowStatus/)
  })

  it('reviewer can move the article to in_review but never publish', async () => {
    const article = await payload.update({
      collection: 'articles',
      id: articleId,
      user: reviewer,
      overrideAccess: false,
      data: { workflowStatus: 'in_review' },
    })
    expect(article.workflowStatus).toBe('in_review')
    expect(article._status).toBe('draft')
  })

  it('reviewer publish attempts are downgraded to approved', async () => {
    const article = await payload.update({
      collection: 'articles',
      id: articleId,
      user: reviewer,
      overrideAccess: false,
      data: { workflowStatus: 'published' },
    })
    expect(article.workflowStatus).toBe('approved')
    expect(article._status).toBe('draft')
  })

  it('anonymous readers cannot see the unpublished article', async () => {
    const result = await payload.find({
      collection: 'articles',
      overrideAccess: false,
      where: { id: { equals: articleId } },
    })
    expect(result.totalDocs).toBe(0)
  })

  it('admin publishes, setting both statuses and publishedAt', async () => {
    const article = await payload.update({
      collection: 'articles',
      id: articleId,
      user: admin,
      overrideAccess: false,
      data: { _status: 'published' },
    })
    expect(article._status).toBe('published')
    expect(article.workflowStatus).toBe('published')
    expect(article.publishedAt).toBeTruthy()
  })

  it('anonymous readers can now see the published article', async () => {
    const result = await payload.find({
      collection: 'articles',
      overrideAccess: false,
      where: { id: { equals: articleId } },
    })
    expect(result.totalDocs).toBe(1)
  })

  it('only admins can delete articles', async () => {
    await expect(
      payload.delete({
        collection: 'articles',
        id: articleId,
        user: reviewer,
        overrideAccess: false,
      }),
    ).rejects.toThrow()

    await payload.delete({
      collection: 'articles',
      id: articleId,
      user: admin,
      overrideAccess: false,
    })
  })
})
