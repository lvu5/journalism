import type { CollectionBeforeChangeHook, CollectionConfig, Where } from 'payload'

import { isAdmin, isReviewer } from '../access/roles'
import { validateHttpUrl } from '../fields/validate-http-url'

const publicContributions: Where = {
  and: [
    { reviewStatus: { equals: 'approved' } },
    { publishInCase: { equals: true } },
  ],
}

const enforceReviewWorkflow: CollectionBeforeChangeHook = ({ data, operation, originalDoc, req }) => {
  if (operation === 'create') {
    data.reviewStatus = 'received'
    data.publishInCase = false
    data.reviewedBy = null
    data.approvedAt = null
    return data
  }

  if (!isReviewer(req.user)) return data

  const reviewStatus = data.reviewStatus ?? originalDoc?.reviewStatus
  if (reviewStatus === 'approved') {
    data.reviewedBy = req.user?.id
    data.approvedAt = originalDoc?.approvedAt || new Date().toISOString()
  } else {
    data.publishInCase = false
    data.approvedAt = null
  }

  return data
}

export const CommunityContributions: CollectionConfig = {
  slug: 'community-contributions',
  labels: { singular: 'Community contribution', plural: 'Community contributions' },
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'incident', 'contributionType', 'reviewStatus', 'createdAt'],
    listSearchableFields: ['title', 'description', 'contributorName', 'contactEmail'],
    group: 'Investigations',
    description: 'Tips and evidence submitted by the public. Nothing is public until approved.',
  },
  access: {
    admin: ({ req }) => isReviewer(req.user),
    create: () => false,
    read: ({ req }) => (isReviewer(req.user) ? true : publicContributions),
    update: ({ req }) => isReviewer(req.user),
    delete: ({ req }) => isAdmin(req.user),
    readVersions: ({ req }) => isReviewer(req.user),
  },
  hooks: { beforeChange: [enforceReviewWorkflow] },
  fields: [
    {
      name: 'incident',
      type: 'relationship',
      relationTo: 'incidents',
      label: 'Case',
      required: true,
      index: true,
    },
    {
      name: 'contributionType',
      type: 'select',
      label: 'Type of contribution',
      required: true,
      defaultValue: 'data-tip',
      options: [
        { label: 'Document or public record', value: 'document' },
        { label: 'First-hand account', value: 'eyewitness' },
        { label: 'Data lead', value: 'data-tip' },
        { label: 'Correction', value: 'correction' },
        { label: 'Background or context', value: 'context' },
        { label: 'Other', value: 'other' },
      ],
    },
    { name: 'title', type: 'text', required: true, maxLength: 180 },
    {
      name: 'description',
      type: 'textarea',
      label: 'Contribution',
      required: true,
      maxLength: 5000,
      admin: { rows: 14 },
    },
    { name: 'sourceUrl', type: 'text', label: 'Source or document URL', validate: validateHttpUrl },
    {
      name: 'contributorName',
      type: 'text',
      label: 'Contributor name (optional)',
      maxLength: 100,
      access: {
        read: ({ req, doc }) => isReviewer(req.user) || doc?.publishName === true,
      },
    },
    {
      name: 'contactEmail',
      type: 'email',
      label: 'Private contact email',
      required: true,
      access: {
        read: ({ req }) => isReviewer(req.user),
        update: ({ req }) => isReviewer(req.user),
      },
      admin: { description: 'Never displayed publicly.' },
    },
    {
      name: 'publishName',
      type: 'checkbox',
      label: 'Contributor allows their name to be published',
      defaultValue: false,
    },
    {
      name: 'consentToReview',
      type: 'checkbox',
      label: 'Contributor confirms this may be reviewed and verified',
      required: true,
      validate: (value) => value === true || 'Consent is required.',
      access: { read: ({ req }) => isReviewer(req.user) },
    },
    {
      name: 'reviewStatus',
      type: 'select',
      required: true,
      defaultValue: 'received',
      index: true,
      options: [
        { label: 'Received', value: 'received' },
        { label: 'Screening', value: 'screening' },
        { label: 'Needs more information', value: 'needs-info' },
        { label: 'Approved', value: 'approved' },
        { label: 'Not used', value: 'rejected' },
      ],
      access: {
        create: () => false,
        read: ({ req }) => isReviewer(req.user),
        update: ({ req }) => isReviewer(req.user),
      },
      admin: { position: 'sidebar' },
    },
    {
      name: 'publishInCase',
      type: 'checkbox',
      label: 'Show on the public case page',
      defaultValue: false,
      access: {
        create: () => false,
        read: ({ req }) => isReviewer(req.user),
        update: ({ req }) => isReviewer(req.user),
      },
      admin: {
        description: 'Only takes effect after the contribution is approved.',
        position: 'sidebar',
      },
    },
    {
      name: 'reviewerNotes',
      type: 'textarea',
      label: 'Private reviewer notes',
      access: {
        read: ({ req }) => isReviewer(req.user),
        update: ({ req }) => isReviewer(req.user),
      },
      admin: { rows: 8 },
    },
    {
      name: 'reviewedBy',
      type: 'relationship',
      relationTo: 'users',
      access: { read: ({ req }) => isReviewer(req.user) },
      admin: { readOnly: true, position: 'sidebar' },
    },
    {
      name: 'approvedAt',
      type: 'date',
      access: { read: ({ req }) => isReviewer(req.user) },
      admin: { readOnly: true, position: 'sidebar' },
    },
  ],
  defaultSort: '-createdAt',
  versions: { maxPerDoc: 100 },
}
