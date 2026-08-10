import type { Metadata } from 'next'
import { headers } from 'next/headers'
import React from 'react'

import { SiteFooter } from '@/components/SiteFooter'
import { SiteHeader } from '@/components/SiteHeader'
import { getLocale } from '@/lib/get-locale'
import { commonCopy } from '@/lib/i18n'

import './styles.css'

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale()
  // Prefer the configured site origin; request headers are only a local-dev
  // fallback, since Host/X-Forwarded-Host are client-spoofable.
  const envURL = process.env.NEXT_PUBLIC_SITE_URL
  let baseURL: URL
  if (envURL) {
    baseURL = new URL(envURL)
  } else {
    const requestHeaders = await headers()
    const forwardedHost = requestHeaders.get('x-forwarded-host')?.split(',')[0]?.trim()
    const host = forwardedHost || requestHeaders.get('host') || 'localhost:3000'
    const forwardedProtocol = requestHeaders.get('x-forwarded-proto')?.split(',')[0]?.trim()
    const protocol = forwardedProtocol || (host.startsWith('localhost') ? 'http' : 'https')
    baseURL = new URL(`${protocol}://${host}`)
  }
  const description = locale === 'vi'
    ? 'Hồ Sơ Mở — báo chí điều tra độc lập, dựa trên dữ kiện, nguồn công khai và quyền phản hồi.'
    : 'Hồ Sơ Mở — independent investigative journalism built on evidence, public sources, and the right of reply.'

  return {
    metadataBase: baseURL,
    // Demo content is meant for development; if it is force-enabled in
    // production, keep it out of search indexes (see src/lib/queries.ts).
    robots: process.env.ENABLE_DEMO_CONTENT === 'true' ? { index: false, follow: false } : undefined,
    description,
    title: {
      default: 'Hồ Sơ Mở — Open Journalism',
      template: '%s · Hồ Sơ Mở',
    },
    openGraph: {
      type: 'website',
      locale: locale === 'vi' ? 'vi_VN' : 'en_US',
      siteName: 'Hồ Sơ Mở',
      title: 'Hồ Sơ Mở — Open Journalism',
      description,
      images: [{ url: new URL('/og.png', baseURL).toString(), width: 1200, height: 630 }],
    },
    twitter: {
      card: 'summary_large_image',
      title: 'Hồ Sơ Mở — Open Journalism',
      description,
      images: [new URL('/og.png', baseURL).toString()],
    },
  }
}

export default async function RootLayout(props: { children: React.ReactNode }) {
  const { children } = props
  const locale = await getLocale()

  return (
    <html lang={locale}>
      <body>
        <a className="skip-link" href="#main-content">
          {commonCopy[locale].skip}
        </a>
        <SiteHeader locale={locale} />
        <main id="main-content">{children}</main>
        <SiteFooter locale={locale} />
      </body>
    </html>
  )
}
