import config from '@payload-config'
import { getPayload, type Payload, type Where } from 'payload'

import { isReviewer } from '../access/roles'
import type { CommunityContribution, Incident, User } from '../payload-types'

export type QueueFilter = 'pending' | 'approved' | 'rejected' | 'all'
export type ReviewStatus = CommunityContribution['reviewStatus']

export type QueueItem = CommunityContribution & { incidentTitle: string }

// getPayload memoizes the instance per config — repeated calls are cheap.
const getClient = (): Promise<Payload> => getPayload({ config })

/** Logs in via Payload auth. The beforeLogin deactivation guard applies. */
export async function login(email: string, password: string): Promise<User> {
  const payload = await getClient()
  const result = await payload.login({ collection: 'users', data: { email, password } })
  if (!result.user) throw new Error('Login failed')
  return result.user as User
}

/** The queue is reviewer/admin tooling — authors are told to use the admin UI. */
export const canTriage = (user: User): boolean => isReviewer(user)

export async function fetchQueue(user: User, filter: QueueFilter = 'pending'): Promise<QueueItem[]> {
  // The queue reads reviewStatus, which only staff may read — gate here so
  // callers get a clear error instead of a Payload query-validation throw.
  if (!canTriage(user)) {
    throw new Error('Only reviewers and admins can read the review queue.')
  }
  const payload = await getClient()
  const where: Where | undefined =
    filter === 'pending'
      ? { reviewStatus: { in: ['received', 'screening', 'needs-info'] } }
      : filter === 'all'
        ? undefined
        : { reviewStatus: { equals: filter } }

  const result = await payload.find({
    collection: 'community-contributions',
    overrideAccess: false,
    user,
    where,
    sort: '-createdAt',
    limit: 100,
    depth: 1,
  })

  return result.docs.map((doc) => ({
    ...doc,
    incidentTitle:
      typeof doc.incident === 'object' && doc.incident !== null
        ? (doc.incident as Incident).title
        : `#${doc.incident}`,
  }))
}

export async function setReviewStatus(
  user: User,
  id: number,
  reviewStatus: ReviewStatus,
): Promise<CommunityContribution> {
  const payload = await getClient()
  // The collection hook stamps reviewedBy/approvedAt and writes the audit row.
  return payload.update({
    collection: 'community-contributions',
    id,
    overrideAccess: false,
    user,
    data: { reviewStatus },
  })
}

export async function setPublishInCase(
  user: User,
  id: number,
  publishInCase: boolean,
): Promise<CommunityContribution> {
  const payload = await getClient()
  const current = await payload.findByID({
    collection: 'community-contributions',
    id,
    overrideAccess: false,
    user,
  })
  if (publishInCase && current.reviewStatus !== 'approved') {
    throw new Error('Only approved contributions can be shown on the public case page.')
  }
  return payload.update({
    collection: 'community-contributions',
    id,
    overrideAccess: false,
    user,
    data: { publishInCase },
  })
}

export async function saveReviewerNotes(
  user: User,
  id: number,
  reviewerNotes: string,
): Promise<CommunityContribution> {
  const payload = await getClient()
  return payload.update({
    collection: 'community-contributions',
    id,
    overrideAccess: false,
    user,
    data: { reviewerNotes },
  })
}
