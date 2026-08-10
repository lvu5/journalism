import type { CollectionConfig, Where } from 'payload'

import { authenticated, getUser, isAdmin, isReviewer } from '../access/roles'

export const Media: CollectionConfig = {
  slug: 'media',
  admin: {
    group: 'Editorial',
    useAsTitle: 'alt',
  },
  access: {
    create: authenticated,
    read: ({ req }) => {
      if (isReviewer(req.user)) return true
      const user = getUser(req.user)
      if (!user) {
        const publicMedia: Where = { visibility: { equals: 'public' } }
        return publicMedia
      }
      const visibleMedia: Where = {
        or: [
          { visibility: { equals: 'public' } },
          { uploadedBy: { equals: user.id } },
        ],
      }
      return visibleMedia
    },
    update: ({ req }) => {
      if (isReviewer(req.user)) return true
      const user = getUser(req.user)
      return user ? { uploadedBy: { equals: user.id } } : false
    },
    delete: ({ req }) => {
      if (isAdmin(req.user)) return true
      const user = getUser(req.user)
      return user ? { uploadedBy: { equals: user.id } } : false
    },
  },
  hooks: {
    beforeChange: [
      ({ data, operation, req }) => {
        if (operation === 'create' && req.user) data.uploadedBy = req.user.id
        return data
      },
    ],
  },
  fields: [
    {
      name: 'alt',
      type: 'text',
      required: true,
    },
    {
      name: 'caption',
      type: 'textarea',
    },
    {
      name: 'visibility',
      type: 'select',
      required: true,
      defaultValue: 'private',
      options: [
        { label: 'Private draft material', value: 'private' },
        { label: 'Public', value: 'public' },
      ],
      admin: { position: 'sidebar' },
    },
    {
      name: 'uploadedBy',
      type: 'relationship',
      relationTo: 'users',
      admin: { position: 'sidebar', readOnly: true },
    },
  ],
  upload: {
    mimeTypes: ['image/*', 'application/pdf'],
    modifyResponseHeaders: ({ headers }) => {
      // Serve PDFs as downloads instead of inline content on our origin.
      if (headers.get('Content-Type') === 'application/pdf') {
        headers.set('Content-Disposition', 'attachment')
      }
      return headers
    },
  },
}
