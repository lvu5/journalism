import 'server-only'

import config from '@payload-config'
import type { User as SupabaseUser } from '@supabase/supabase-js'
import { randomBytes } from 'node:crypto'
import { getPayload } from 'payload'

import type { User as PayloadUser } from '@/payload-types'

export class AuthorIdentityError extends Error {}

export function publicNameFromSupabaseUser(user: SupabaseUser): string {
  const candidate = user.user_metadata?.public_name
  if (typeof candidate === 'string') {
    const value = candidate.trim()
    if (value.length >= 2) return value.slice(0, 100)
  }

  const emailName = user.email?.split('@')[0]?.trim()
  return (emailName || 'Author').slice(0, 100)
}

const randomPayloadPassword = () => randomBytes(48).toString('base64url')

/**
 * Resolve a verified Supabase account to the Payload user used by editorial
 * access rules. Public users never receive the generated Payload password.
 */
export async function syncSupabaseAuthor(user: SupabaseUser): Promise<PayloadUser> {
  if (!user.email) throw new AuthorIdentityError('The Supabase account has no email address.')

  const payload = await getPayload({ config })
  const bySupabaseID = await payload.find({
    collection: 'users',
    depth: 0,
    limit: 1,
    overrideAccess: true,
    where: { supabaseUserId: { equals: user.id } },
  })
  const linked = bySupabaseID.docs[0]

  if (linked) {
    if (linked.active === false) throw new AuthorIdentityError('This author account is inactive.')
    return linked
  }

  const byEmail = await payload.find({
    collection: 'users',
    depth: 0,
    limit: 1,
    overrideAccess: true,
    where: { email: { equals: user.email.toLowerCase() } },
  })
  const existing = byEmail.docs[0]

  if (existing) {
    if (existing.supabaseUserId && existing.supabaseUserId !== user.id) {
      throw new AuthorIdentityError('This email is already linked to another account.')
    }
    if (existing.roles?.some((role) => role === 'admin' || role === 'reviewer')) {
      throw new AuthorIdentityError('Editorial staff accounts must use the Payload staff login.')
    }
    if (existing.active === false) throw new AuthorIdentityError('This author account is inactive.')

    // Rotate the old local password while migrating an existing author. From
    // this point on, Supabase is their only public sign-in method.
    return payload.update({
      collection: 'users',
      id: existing.id,
      overrideAccess: true,
      data: {
        password: randomPayloadPassword(),
        supabaseUserId: user.id,
      },
    })
  }

  // Payload's first auth document is the administrator bootstrap. Creating a
  // public author first would hide that setup screen and leave no staff user
  // able to manage the site.
  const { totalDocs } = await payload.count({ collection: 'users', overrideAccess: true })
  if (totalDocs === 0) {
    throw new AuthorIdentityError('Create the first Payload administrator at /admin first.')
  }

  return payload.create({
    collection: 'users',
    overrideAccess: true,
    data: {
      active: true,
      email: user.email.toLowerCase(),
      password: randomPayloadPassword(),
      publicName: publicNameFromSupabaseUser(user),
      roles: ['author'],
      supabaseUserId: user.id,
    },
  })
}
