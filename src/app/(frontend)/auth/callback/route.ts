import type { EmailOtpType } from '@supabase/supabase-js'
import { NextResponse, type NextRequest } from 'next/server'

import { syncSupabaseAuthor } from '@/lib/author-identity'
import { safeNextPath } from '@/lib/auth'
import { createSupabaseServerClient } from '@/lib/supabase/server'

const allowedOtpTypes = new Set<EmailOtpType>([
  'email',
  'email_change',
  'invite',
  'magiclink',
  'recovery',
  'signup',
])

export async function GET(request: NextRequest) {
  const url = new URL(request.url)
  const nextPath = safeNextPath(url.searchParams.get('next'), '/author')
  const code = url.searchParams.get('code')
  const tokenHash = url.searchParams.get('token_hash')
  const requestedType = url.searchParams.get('type') as EmailOtpType | null

  try {
    const supabase = await createSupabaseServerClient()
    let error: Error | null = null

    if (code) {
      const result = await supabase.auth.exchangeCodeForSession(code)
      error = result.error
    } else if (tokenHash && requestedType && allowedOtpTypes.has(requestedType)) {
      const result = await supabase.auth.verifyOtp({ token_hash: tokenHash, type: requestedType })
      error = result.error
    } else {
      error = new Error('Missing or invalid authentication callback parameters.')
    }

    if (error) throw error
    const { data, error: userError } = await supabase.auth.getUser()
    if (userError || !data.user) throw userError || new Error('No authenticated user.')
    await syncSupabaseAuthor(data.user)

    return NextResponse.redirect(new URL(nextPath, request.url))
  } catch (error) {
    console.error('[auth] confirmation callback failed', error)
    const loginURL = new URL('/login', request.url)
    loginURL.searchParams.set('error', 'confirmation')
    return NextResponse.redirect(loginURL)
  }
}
