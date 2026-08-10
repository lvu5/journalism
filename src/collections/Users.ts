import type { CollectionConfig } from 'payload'

import { admins, getUser, hasRole, isAdmin } from '../access/roles'

export const Users: CollectionConfig = {
  slug: 'users',
  admin: {
    useAsTitle: 'publicName',
    defaultColumns: ['publicName', 'email', 'roles', 'active', 'updatedAt'],
    group: 'People & access',
  },
  auth: {
    maxLoginAttempts: 5,
    lockTime: 10 * 60 * 1000,
    tokenExpiration: 2 * 60 * 60,
  },
  hooks: {
    beforeLogin: [
      // Deactivated staff must not be able to log in. Note: existing JWTs
      // remain valid until they expire (tokenExpiration) — for immediate
      // revocation, see #44.
      ({ user }) => {
        if (user && 'active' in user && user.active === false) {
          throw new Error('This account has been deactivated. Contact an administrator.')
        }
        return user
      },
    ],
  },
  access: {
    admin: ({ req }) => Boolean(req.user),
    create: admins,
    delete: admins,
    read: ({ req }) => {
      if (isAdmin(req.user) || hasRole(req.user, ['reviewer'])) return true
      const user = getUser(req.user)
      return user ? { id: { equals: user.id } } : false
    },
    update: ({ req }) => {
      if (isAdmin(req.user)) return true
      const user = getUser(req.user)
      return user ? { id: { equals: user.id } } : false
    },
    readVersions: admins,
  },
  fields: [
    {
      name: 'publicName',
      type: 'text',
      label: 'Public name',
      required: true,
      maxLength: 100,
    },
    {
      name: 'bio',
      type: 'textarea',
      maxLength: 500,
    },
    {
      name: 'roles',
      type: 'select',
      hasMany: true,
      required: true,
      defaultValue: ({ req }) => (req.user ? ['author'] : ['admin']),
      saveToJWT: true,
      options: [
        { label: 'Administrator', value: 'admin' },
        { label: 'Reviewer', value: 'reviewer' },
        { label: 'Author', value: 'author' },
      ],
      access: {
        create: ({ req }) => isAdmin(req.user),
        update: ({ req }) => isAdmin(req.user),
      },
      admin: {
        description: 'Reviewers can also write. Only administrators can change roles.',
        position: 'sidebar',
      },
    },
    {
      name: 'active',
      type: 'checkbox',
      defaultValue: true,
      saveToJWT: true,
      access: {
        create: ({ req }) => isAdmin(req.user),
        update: ({ req }) => isAdmin(req.user),
      },
      admin: { position: 'sidebar' },
    },
  ],
  versions: { maxPerDoc: 100 },
}
