import {
  slugField,
  type CollectionBeforeChangeHook,
  type CollectionConfig,
  type Where,
} from 'payload'

import { authenticated, getUser, hasRole, isAdmin, isReviewer } from '../access/roles'

const publicArticle: Where = {
  and: [
    { _status: { equals: 'published' } },
    { workflowStatus: { equals: 'published' } },
  ],
}

const protectWorkflow: CollectionBeforeChangeHook = ({ data, operation, originalDoc, req }) => {
  const user = getUser(req.user)

  // Trusted server-side tasks such as the seed script may publish demo content.
  if (!user) {
    if (data._status === 'published' || data.workflowStatus === 'published') {
      data._status = 'published'
      data.workflowStatus = 'published'
      data.publishedAt ||= new Date().toISOString()
    }
    return data
  }

  if (operation === 'create') {
    data.submittedBy = user.id
  } else if (originalDoc?.submittedBy) {
    data.submittedBy = originalDoc.submittedBy
  }

  if (isAdmin(user)) {
    if (data._status === 'published' || data.workflowStatus === 'published') {
      data._status = 'published'
      data.workflowStatus = 'published'
      data.publishedAt ||= new Date().toISOString()
    } else if (originalDoc?._status === 'published' && data._status === 'draft') {
      data.workflowStatus = 'approved'
    }
    return data
  }

  // Reviewers can move submissions through review, but only admins publish.
  if (isReviewer(user)) {
    data._status = 'draft'
    if (data.workflowStatus === 'published') data.workflowStatus = 'approved'
    return data
  }

  const previousStatus = originalDoc?.workflowStatus ?? 'draft'
  const nextStatus = data.workflowStatus ?? previousStatus
  const authorCanEdit = ['draft', 'changes_requested'].includes(previousStatus)
  const validTransition = nextStatus === previousStatus || nextStatus === 'submitted'

  if (!authorCanEdit || !validTransition) {
    throw new Error('Authors can edit drafts and resubmit articles after requested changes.')
  }

  data._status = 'draft'
  return data
}

export const Articles: CollectionConfig = {
  slug: 'articles',
  labels: { singular: 'Article', plural: 'Articles' },
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'workflowStatus', 'eventDate', 'submittedBy', 'updatedAt'],
    listSearchableFields: ['title', 'slug', 'summary'],
    group: 'Editorial',
    description: 'Draft, review, and publish reported articles.',
  },
  access: {
    admin: ({ req }) => Boolean(req.user),
    create: authenticated,
    read: ({ req }) => {
      if (isReviewer(req.user)) return true
      const user = getUser(req.user)
      if (!user) return publicArticle
      return {
        or: [
          publicArticle,
          { submittedBy: { equals: user.id } },
          { authors: { contains: user.id } },
        ],
      }
    },
    update: ({ req }) => {
      if (isReviewer(req.user)) return true
      const user = getUser(req.user)
      if (!user || !hasRole(user, ['author'])) return false
      const ownDraft: Where = {
        and: [
          { _status: { equals: 'draft' } },
          {
            or: [
              { submittedBy: { equals: user.id } },
              { authors: { contains: user.id } },
            ],
          },
        ],
      }
      return ownDraft
    },
    delete: ({ req }) => isAdmin(req.user),
    readVersions: ({ req }) => {
      if (isReviewer(req.user)) return true
      const user = getUser(req.user)
      return user ? { submittedBy: { equals: user.id } } : false
    },
  },
  hooks: {
    beforeChange: [protectWorkflow],
  },
  fields: [
    {
      type: 'tabs',
      tabs: [
        {
          label: 'Story',
          fields: [
            { name: 'title', type: 'text', required: true, maxLength: 180, index: true },
            slugField({ useAsSlug: 'title', required: true }),
            {
              name: 'eventDate',
              type: 'date',
              label: 'Date',
              required: true,
              index: true,
              admin: { date: { pickerAppearance: 'dayOnly' } },
            },
            {
              name: 'summary',
              type: 'textarea',
              required: true,
              maxLength: 320,
              admin: { description: 'A concise standfirst for cards and search results.' },
            },
            {
              name: 'bodyMarkdown',
              type: 'textarea',
              label: 'Description (Markdown)',
              required: true,
              admin: {
                description: 'Markdown is rendered as formatted text; raw HTML is not published.',
                rows: 28,
              },
            },
            {
              name: 'authors',
              type: 'relationship',
              relationTo: 'users',
              hasMany: true,
              label: 'Authors (optional)',
              filterOptions: { active: { equals: true } },
            },
            {
              name: 'byline',
              type: 'array',
              label: 'Public byline (optional)',
              admin: {
                description: 'Use for guest or pseudonymous contributors who do not have an account.',
              },
              fields: [
                { name: 'name', type: 'text', required: true, maxLength: 100 },
              ],
            },
          ],
        },
        {
          label: 'Citations',
          fields: [
            {
              name: 'citations',
              type: 'array',
              required: true,
              minRows: 1,
              labels: { singular: 'Citation', plural: 'Citations' },
              fields: [
                { name: 'sourceTitle', type: 'text', required: true, maxLength: 240 },
                { name: 'publisher', type: 'text', maxLength: 140 },
                { name: 'url', type: 'text', required: true },
                {
                  name: 'accessedAt',
                  type: 'date',
                  required: true,
                  admin: { date: { pickerAppearance: 'dayOnly' } },
                },
                { name: 'archiveUrl', type: 'text', label: 'Archived URL' },
                {
                  name: 'note',
                  type: 'textarea',
                  label: 'Relevance note',
                  maxLength: 500,
                },
              ],
            },
          ],
        },
        {
          label: 'Corrections',
          fields: [
            {
              name: 'corrections',
              type: 'array',
              labels: { singular: 'Correction', plural: 'Corrections' },
              admin: {
                description:
                  'Public corrections and clarifications. Never edit a published story silently — add a dated correction instead.',
                initCollapsed: true,
              },
              fields: [
                { name: 'note', type: 'textarea', required: true, maxLength: 1000 },
                {
                  name: 'issuedAt',
                  type: 'date',
                  label: 'Issued at',
                  required: true,
                  defaultValue: () => new Date().toISOString(),
                  admin: { date: { pickerAppearance: 'dayAndTime' } },
                },
              ],
            },
          ],
        },
        {
          label: 'Connections',
          fields: [
            {
              name: 'relatedIncidents',
              type: 'relationship',
              relationTo: 'incidents',
              hasMany: true,
            },
            {
              name: 'topics',
              type: 'select',
              hasMany: true,
              options: [
                { label: 'Public spending', value: 'public-spending' },
                { label: 'Environment', value: 'environment' },
                { label: 'Justice', value: 'justice' },
                { label: 'Labour', value: 'labour' },
                { label: 'Land', value: 'land' },
                { label: 'Public services', value: 'public-services' },
              ],
            },
          ],
        },
      ],
    },
    {
      name: 'workflowStatus',
      type: 'select',
      required: true,
      defaultValue: 'draft',
      index: true,
      saveToJWT: false,
      options: [
        { label: 'Draft', value: 'draft' },
        { label: 'Submitted', value: 'submitted' },
        { label: 'In review', value: 'in_review' },
        { label: 'Changes requested', value: 'changes_requested' },
        { label: 'Approved', value: 'approved' },
        { label: 'Published', value: 'published' },
        { label: 'Rejected', value: 'rejected' },
      ],
      admin: {
        position: 'sidebar',
        description: 'Authors may submit; reviewers decide; administrators publish.',
      },
    },
    {
      name: 'submittedBy',
      type: 'relationship',
      relationTo: 'users',
      admin: { position: 'sidebar', readOnly: true },
    },
    {
      name: 'publishedAt',
      type: 'date',
      index: true,
      admin: { position: 'sidebar', date: { pickerAppearance: 'dayAndTime' } },
    },
    {
      name: 'featured',
      type: 'checkbox',
      defaultValue: false,
      admin: { position: 'sidebar' },
    },
  ],
  defaultSort: '-publishedAt',
  versions: {
    drafts: { autosave: true, validate: false },
    maxPerDoc: 100,
  },
}
