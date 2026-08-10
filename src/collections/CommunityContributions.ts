import type {
  CollectionAfterChangeHook,
  CollectionAfterReadHook,
  CollectionBeforeChangeHook,
  CollectionConfig,
  PayloadRequest,
  Where,
} from 'payload'

import { isAdmin, isReviewer } from '../access/roles'
import { validateHttpUrl } from '../fields/validate-http-url'
import { decryptField, encryptField, isEncrypted, tryDecryptField } from '../lib/field-crypto'

const publicContributions: Where = {
  and: [
    { reviewStatus: { equals: 'approved' } },
    { publishInCase: { equals: true } },
  ],
}

// Append-only audit trail (see the audit-logs collection). Written on a
// fresh connection (no `req` threading) so a failed audit insert can never
// roll back the editorial update it accompanies. Never block the flow if
// logging itself fails — but do surface the error.
const writeAuditLog = async (
  req: PayloadRequest,
  action: 'contribution-status-change' | 'pii-read',
  contributionId: number | string,
  details?: string,
) => {
  try {
    await req.payload.create({
      collection: 'audit-logs',
      overrideAccess: true,
      data: {
        action,
        actor: req.user?.id,
        targetCollection: 'community-contributions',
        targetId: String(contributionId),
        details,
      },
    })
  } catch (error) {
    console.error('[audit] failed to write audit log', error)
  }
}

// Log when a staff member opens an individual contribution. Excluded: bulk
// list reads (findMany), and the read echo Payload runs after an update
// (beforeChange marks the request so updates never masquerade as views).
const auditPiiRead: CollectionAfterReadHook = async ({ doc, findMany, req }) => {
  if (!findMany && req.user && doc.contactEmail && !req.context.skipPiiAudit) {
    await writeAuditLog(req, 'pii-read', doc.id)
  }
  return doc
}

const auditStatusChange: CollectionAfterChangeHook = async ({ doc, operation, previousDoc, req }) => {
  if (operation !== 'create' && previousDoc && previousDoc.reviewStatus !== doc.reviewStatus) {
    await writeAuditLog(
      req,
      'contribution-status-change',
      doc.id,
      `${previousDoc.reviewStatus} → ${doc.reviewStatus}`,
    )
  }
  return doc
}

const enforceReviewWorkflow: CollectionBeforeChangeHook = ({ data, operation, originalDoc, req }) => {
  if (operation === 'create') {
    data.reviewStatus = 'received'
    data.publishInCase = false
    data.reviewedBy = null
    data.approvedAt = null
    return data
  }

  // Payload re-reads the document after an update; that echo must not log a
  // PII view (see auditPiiRead).
  req.context.skipPiiAudit = true

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
    // contactEmail is encrypted at rest — ciphertext is not searchable.
    listSearchableFields: ['title', 'description', 'contributorName'],
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
  hooks: {
    beforeChange: [enforceReviewWorkflow],
    afterChange: [auditStatusChange],
    afterRead: [auditPiiRead],
  },
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
      // text (not email): the stored value is ciphertext, so the built-in
      // email validation would reject it after encryption.
      type: 'text',
      label: 'Private contact email',
      required: true,
      validate: (value: unknown) => {
        if (typeof value !== 'string' || !value) return 'Enter a valid email address.'
        if (isEncrypted(value)) {
          const plaintext = tryDecryptField(value)
          if (plaintext === null) return 'Stored value cannot be decrypted.'
          return /^\S+@\S+\.\S+$/.test(plaintext) || 'Enter a valid email address.'
        }
        return /^\S+@\S+\.\S+$/.test(value) || 'Enter a valid email address.'
      },
      hooks: {
        // Encrypted at rest (AES-256-GCM, key derived from PAYLOAD_SECRET).
        // The enc:v1: prefix makes re-encryption of existing rows idempotent.
        beforeChange: [
          ({ value }) =>
            typeof value === 'string' && value ? encryptField(value) : value,
        ],
        afterRead: [
          // Anonymous reads never receive this field (access control strips
          // it) — skip the decryption work entirely for them.
          ({ req, value }) =>
            typeof value === 'string' && req.user ? decryptField(value) : value,
        ],
      },
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
