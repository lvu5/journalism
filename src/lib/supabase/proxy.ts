import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

import { getSupabasePublicConfig } from './config'

export async function refreshSupabaseSession(request: NextRequest) {
  const config = getSupabasePublicConfig()
  if (!config) return NextResponse.next({ request })

  let response = NextResponse.next({ request })
  const supabase = createServerClient(config.url, config.publishableKey, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll: (cookiesToSet) => {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
        response = NextResponse.next({ request })
        cookiesToSet.forEach(({ name, options, value }) => {
          response.cookies.set(name, value, options)
        })
      },
    },
  })

  // This verifies an existing token and refreshes it when necessary. Do not
  // trust data read directly from the cookie before this call.
  await supabase.auth.getUser()
  return response
}
