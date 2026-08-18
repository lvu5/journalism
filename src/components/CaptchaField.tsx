'use client'

import { Turnstile, type TurnstileInstance } from '@marsidev/react-turnstile'
import { useEffect, useRef, useState } from 'react'

import type { Locale } from '@/lib/i18n'

export function CaptchaField({ locale, resetSignal }: { locale: Locale; resetSignal: object }) {
  const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY
  const instance = useRef<TurnstileInstance | undefined>(undefined)
  const [token, setToken] = useState('')

  useEffect(() => {
    instance.current?.reset()
    const resetToken = window.setTimeout(() => setToken(''), 0)
    return () => window.clearTimeout(resetToken)
  }, [resetSignal])

  if (!siteKey) return null

  return (
    <div className="captcha-field">
      <input name="captchaToken" readOnly type="hidden" value={token} />
      <Turnstile
        onError={() => setToken('')}
        onExpire={() => setToken('')}
        onSuccess={setToken}
        options={{ language: locale, size: 'flexible', theme: 'light' }}
        ref={instance}
        siteKey={siteKey}
      />
    </div>
  )
}
