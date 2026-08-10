import type {
  CollectionAfterChangeHook,
  CollectionBeforeValidateHook,
  CollectionConfig,
} from 'payload'
import { ValidationError } from 'payload'

import { getUser, isAdmin, isReviewer, reviewers } from '../access/roles'
import type { Article } from '../payload-types'

const syncReviewDecision: CollectionAfterChangeHook = async ({ context, doc, req }) => {
  if (context.skipReviewSync) return doc

  const articleID = typeof doc.article === 'object' ? doc.article.id : doc.article
  const statusByDecision: Record<string, Article['workflowStatus']> = {
    approve: 'approved',
    changes_requested: 'changes_requested',
    reject: 'rejected',
  }

  await req.payload.update({
    collection: 'articles',
    id: articleID,
    data: { workflowStatus: statusByDecision[doc.decision] },
    context: { skipReviewSync: true },
    overrideAccess: false,
    req,
  })

  return doc
}

const REVIEWABLE_STATES = ['submitted', 'in_review', 'changes_requested', 'approved']

// Server-side enforcement of what the admin dropdown only suggests: a review
// can only target an article that is actually in review, and never the
// reviewer's own submission.
const enforceReviewEligibility: CollectionBeforeValidateHook = async ({ data, operation, req }) => {
  if (operation !== 'create' || !data) return data

  const articleRef = data.article
  const articleID = typeof articleRef === 'object' && articleRef !== null ? articleRef.id : articleRef
  if (!articleID) return data // the required field validation reports a missing article

  const article = await req.payload.findByID({
    collection: 'articles',
    id: articleID,
    depth: 0,
    overrideAccess: false,
    req,
  })

  const submittedByRef = article.submittedBy
  const submittedBy =
    typeof submittedByRef === 'object' && submittedByRef !== null ? submittedByRef.id : submittedByRef
  if (req.user && submittedBy === req.user.id) {
    throw new ValidationError({
      collection: 'reviews',
      errors: [{ message: 'Reviewers cannot review their own submissions.', path: 'article' }],
    })
  }

  if (!REVIEWABLE_STATES.includes(article.workflowStatus ?? '')) {
    throw new ValidationError({
      collection: 'reviews',
      errors: [
        { message: 'Only articles awaiting review can receive a review decision.', path: 'article' },
      ],
    })
  }

  return data
}

export const Reviews: CollectionConfig = {
  slug: 'reviews',
  labels: { singular: 'Review', plural: 'Reviews' },
  admin: {
    useAsTitle: 'id',
    defaultColumns: ['article', 'decision', 'reviewer', 'createdAt'],
    group: 'Editorial',
    description: 'Private editorial decisions and feedback.',
  },
  access: {
    admin: ({ req }) => isReviewer(req.user),
    create: reviewers,
    read: ({ req }) => {
      if (isReviewer(req.user)) return true
      const user = getUser(req.user)
      return user ? { 'article.submittedBy': { equals: user.id } } : false
    },
    update: ({ req }) => isAdmin(req.user),
    delete: ({ req }) => isAdmin(req.user),
  },
  hooks: {
    beforeValidate: [enforceReviewEligibility],
    beforeChange: [
      ({ data, operation, req }) => {
        if (operation === 'create' && req.user) data.reviewer = req.user.id
        return data
      },
    ],
    afterChange: [syncReviewDecision],
  },
  fields: [
    {
      name: 'article',
      type: 'relationship',
      relationTo: 'articles',
      required: true,
      filterOptions: {
        workflowStatus: { in: ['submitted', 'in_review', 'changes_requested', 'approved'] },
      },
    },
    {
      name: 'decision',
      type: 'select',
      required: true,
      options: [
        { label: 'Approve', value: 'approve' },
        { label: 'Request changes', value: 'changes_requested' },
        { label: 'Reject', value: 'reject' },
      ],
    },
    {
      name: 'comments',
      type: 'textarea',
      required: true,
      maxLength: 5000,
      admin: { description: 'Visible to the submitting author and editorial staff.' },
    },
    {
      name: 'reviewer',
      type: 'relationship',
      relationTo: 'users',
      required: true,
      admin: { position: 'sidebar', readOnly: true },
    },
  ],
  defaultSort: '-createdAt',
  versions: { maxPerDoc: 100 },
}
