import type { Access } from 'payload'

export type Role = 'admin' | 'reviewer' | 'author'

export type JournalismUser = {
  id: number | string
  roles?: Role[] | null
}

export const getUser = (user: unknown): JournalismUser | null => {
  if (!user || typeof user !== 'object' || !('id' in user)) return null
  return user as JournalismUser
}

export const hasRole = (user: unknown, roles: Role[]) => {
  const journalismUser = getUser(user)
  return Boolean(journalismUser?.roles?.some((role) => roles.includes(role)))
}

export const isAdmin = (user: unknown) => hasRole(user, ['admin'])
export const isReviewer = (user: unknown) => hasRole(user, ['admin', 'reviewer'])

export const authenticated: Access = ({ req }) => Boolean(req.user)
export const admins: Access = ({ req }) => isAdmin(req.user)
export const reviewers: Access = ({ req }) => isReviewer(req.user)

