import type { User as SupabaseUser } from '@supabase/supabase-js'

import { publicNameFromSupabaseUser } from '@/lib/author-identity'
import { getSupabasePublicConfig } from '@/lib/supabase/config'
import { createSupabaseServerClient } from '@/lib/supabase/server'

export type PublicUser = {
  email: string
  id: string
  publicName: string
}

/** Return the verified Supabase user represented by the request cookies. */
export async function getCurrentSupabaseUser(): Promise<SupabaseUser | null> {
  if (!getSupabasePublicConfig()) return null

  try {
    const supabase = await createSupabaseServerClient()
    const { data, error } = await supabase.auth.getUser()
    if (error) return null
    return data.user
  } catch {
    return null
  }
}

export async function getCurrentUser(): Promise<PublicUser | null> {
  const user = await getCurrentSupabaseUser()
  if (!user?.email) return null

  return {
    email: user.email,
    id: user.id,
    publicName: publicNameFromSupabaseUser(user),
  }
}

/** Only allow same-origin relative redirects supplied by our own forms. */
export function safeNextPath(value: string | null | undefined, fallback = '/'): string {
  if (!value || !value.startsWith('/') || value.startsWith('//') || value.includes('\\')) {
    return fallback
  }
  if (
    value.startsWith('/auth') ||
    value.startsWith('/login') ||
    value.startsWith('/register')
  ) return fallback
  return value
}
