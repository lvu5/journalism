import 'server-only'

import { cookies } from 'next/headers'

import { localeCookieName, type Locale } from './i18n'

export async function getLocale(): Promise<Locale> {
  const value = (await cookies()).get(localeCookieName)?.value
  return value === 'en' ? 'en' : 'vi'
}
