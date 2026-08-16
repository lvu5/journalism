import 'server-only'

import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

import { requireSupabasePublicConfig } from './config'

export async function createSupabaseServerClient() {
  const { publishableKey, url } = requireSupabasePublicConfig()
  const cookieStore = await cookies()

  return createServerClient(url, publishableKey, {
    cookies: {
      getAll: () => cookieStore.getAll(),
      setAll: (cookiesToSet) => {
        try {
          cookiesToSet.forEach(({ name, options, value }) => {
            cookieStore.set(name, value, options)
          })
        } catch {
          // Server Components cannot write cookies. src/proxy.ts refreshes the
          // session; Server Actions and Route Handlers can write normally.
        }
      },
    },
  })
}
