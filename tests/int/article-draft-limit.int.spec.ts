import { beforeEach, describe, expect, it, vi } from 'vitest'

import { initialArticleSubmissionState } from '@/lib/article-submission-state'

const payloadMocks = vi.hoisted(() => ({
  count: vi.fn(),
  create: vi.fn(),
  findByID: vi.fn(),
  update: vi.fn(),
}))
const navigationMocks = vi.hoisted(() => ({
  redirect: vi.fn((path: string) => {
    throw new Error(`redirect:${path}`)
  }),
}))

vi.mock('@payload-config', () => ({ default: {} }))
vi.mock('next/navigation', () => navigationMocks)
vi.mock('payload', () => ({ getPayload: vi.fn(async () => payloadMocks) }))
vi.mock('@/lib/auth', () => ({
  getCurrentSupabaseUser: vi.fn(async () => ({
    email: 'author@example.com',
    id: 'supabase-author-id',
  })),
}))
vi.mock('@/lib/author-identity', () => ({
  syncSupabaseAuthor: vi.fn(async () => ({
    active: true,
    email: 'author@example.com',
    id: 42,
    publicName: 'Test Author',
    roles: ['author'],
  })),
}))

import { submitArticle } from '@/app/(frontend)/author/articles/new/actions'

const draftForm = () => {
  const form = new FormData()
  form.set('intent', 'draft')
  form.set('locale', 'en')
  form.set('title', 'Saved investigation')
  return form
}

describe('Saved article draft limit', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    payloadMocks.count.mockResolvedValue({ totalDocs: 10 })
  })

  it('enforces the ten-draft cap on the server before creating an article', async () => {
    const result = await submitArticle(initialArticleSubmissionState, draftForm())

    expect(result.status).toBe('error')
    expect(result.message).toMatch(/10 saved drafts/)
    expect(payloadMocks.create).not.toHaveBeenCalled()
  })

  it('still allows an existing draft to be saved when all ten slots are occupied', async () => {
    payloadMocks.findByID.mockResolvedValue({
      id: 42,
      submittedBy: 42,
      workflowStatus: 'draft',
    })
    payloadMocks.update.mockResolvedValue({ id: 42 })
    const form = draftForm()
    form.set('articleId', '42')

    await expect(submitArticle(initialArticleSubmissionState, form)).rejects.toThrow(
      'redirect:/author/articles/42/edit?saved=1',
    )
    expect(payloadMocks.count).not.toHaveBeenCalled()
    expect(payloadMocks.update).toHaveBeenCalledOnce()
    expect(payloadMocks.create).not.toHaveBeenCalled()
  })
})
