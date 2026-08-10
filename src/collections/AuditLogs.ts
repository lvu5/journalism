import type { CollectionConfig } from 'payload'

import { isAdmin } from '../access/roles'

// Append-only audit trail for sensitive editorial events: who viewed
// contributor PII, and who changed a contribution's review state. Rows are
// written by server-side hooks with overrideAccess; nobody can create,
// modify, or delete them through the API — not even admins.
export const AuditLogs: CollectionConfig = {
  slug: 'audit-logs',
  labels: { singular: 'Audit log', plural: 'Audit logs' },
  admin: {
    useAsTitle: 'action',
    defaultColumns: ['action', 'actor', 'targetCollection', 'targetId', 'createdAt'],
    group: 'People & access',
    description: 'Append-only record of sensitive actions. Rows cannot be edited or deleted.',
  },
  access: {
    admin: ({ req }) => isAdmin(req.user),
    create: () => false,
    read: ({ req }) => isAdmin(req.user),
    update: () => false,
    delete: () => false,
  },
  fields: [
    {
      name: 'action',
      type: 'select',
      required: true,
      options: [
        { label: 'Viewed contributor contact details', value: 'pii-read' },
        { label: 'Changed contribution review status', value: 'contribution-status-change' },
      ],
    },
    {
      name: 'actor',
      type: 'relationship',
      relationTo: 'users',
    },
    { name: 'targetCollection', type: 'text', required: true, maxLength: 100 },
    { name: 'targetId', type: 'text', required: true, maxLength: 100 },
    {
      name: 'details',
      type: 'textarea',
      maxLength: 1000,
      admin: { description: 'Short context, e.g. the previous and next review status.' },
    },
  ],
  defaultSort: '-createdAt',
}
