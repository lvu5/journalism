import { slugField, type CollectionBeforeChangeHook, type CollectionConfig } from 'payload'

import { getUser, isAdmin, isReviewer, reviewers } from '../access/roles'

const incidentWorkflow: CollectionBeforeChangeHook = ({ data, req }) => {
  const user = getUser(req.user)
  if (user && !isAdmin(user)) data._status = 'draft'
  if (data.caseStatus === 'closed') data.crowdsourcingEnabled = false
  return data
}

export const Incidents: CollectionConfig = {
  slug: 'incidents',
  labels: { singular: 'Case', plural: 'Cases' },
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'caseStatus', 'verificationStatus', 'dateStart', 'updatedAt'],
    listSearchableFields: ['title', 'summary', 'location'],
    group: 'Investigations',
    description: 'Verified incident records that power the notable list and timeline.',
  },
  access: {
    admin: ({ req }) => isReviewer(req.user),
    create: reviewers,
    read: ({ req }) => {
      if (isReviewer(req.user)) return true
      return { _status: { equals: 'published' } }
    },
    update: reviewers,
    delete: ({ req }) => isAdmin(req.user),
    readVersions: reviewers,
  },
  hooks: { beforeChange: [incidentWorkflow] },
  fields: [
    { name: 'title', type: 'text', required: true, maxLength: 180, index: true },
    slugField({ useAsSlug: 'title', required: true }),
    {
      type: 'row',
      fields: [
        {
          name: 'dateStart',
          type: 'date',
          label: 'Start date',
          required: true,
          index: true,
          admin: { width: '50%', date: { pickerAppearance: 'dayOnly' } },
        },
        {
          name: 'dateEnd',
          type: 'date',
          label: 'End date (optional)',
          admin: { width: '50%', date: { pickerAppearance: 'dayOnly' } },
        },
      ],
    },
    { name: 'summary', type: 'textarea', required: true, maxLength: 500 },
    {
      name: 'notabilityReason',
      type: 'textarea',
      label: 'Why this incident is notable',
      required: true,
      maxLength: 1200,
    },
    { name: 'location', type: 'text', maxLength: 140, index: true },
    {
      name: 'caseStatus',
      type: 'select',
      label: 'Case status',
      required: true,
      defaultValue: 'newly-opened',
      index: true,
      options: [
        { label: 'Newly opened', value: 'newly-opened' },
        { label: 'Investigating', value: 'investigating' },
        { label: 'Open for contributions', value: 'accepting-contributions' },
        { label: 'Reviewing contributions', value: 'reviewing-contributions' },
        { label: 'Closed', value: 'closed' },
      ],
      admin: {
        description: 'The public lifecycle of the case. This is separate from verification status.',
        position: 'sidebar',
      },
    },
    {
      name: 'crowdsourcingEnabled',
      type: 'checkbox',
      label: 'Accept community contributions',
      defaultValue: false,
      admin: {
        condition: (_, siblingData) => siblingData?.caseStatus !== 'closed',
        description: 'Opens the public contribution form for this case.',
        position: 'sidebar',
      },
    },
    {
      name: 'verificationStatus',
      type: 'select',
      required: true,
      defaultValue: 'under-review',
      index: true,
      options: [
        { label: 'Under review', value: 'under-review' },
        { label: 'Disputed', value: 'disputed' },
        { label: 'Confirmed', value: 'confirmed' },
        { label: 'Resolved', value: 'resolved' },
      ],
      admin: { position: 'sidebar' },
    },
    {
      name: 'severity',
      type: 'select',
      required: true,
      defaultValue: 'medium',
      options: [
        { label: 'Low', value: 'low' },
        { label: 'Medium', value: 'medium' },
        { label: 'High', value: 'high' },
      ],
      admin: { position: 'sidebar' },
    },
    {
      name: 'relatedArticles',
      type: 'relationship',
      relationTo: 'articles',
      hasMany: true,
    },
    {
      name: 'citations',
      type: 'array',
      minRows: 1,
      required: true,
      fields: [
        { name: 'sourceTitle', type: 'text', required: true },
        { name: 'url', type: 'text', required: true },
        { name: 'archiveUrl', type: 'text', label: 'Archived URL' },
        {
          name: 'accessedAt',
          type: 'date',
          required: true,
          admin: { date: { pickerAppearance: 'dayOnly' } },
        },
      ],
    },
    {
      name: 'featured',
      type: 'checkbox',
      defaultValue: false,
      admin: { position: 'sidebar' },
    },
  ],
  defaultSort: '-dateStart',
  versions: {
    drafts: { autosave: true, validate: false },
    maxPerDoc: 100,
  },
}
