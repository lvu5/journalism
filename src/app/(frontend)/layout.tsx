import type { Metadata } from 'next'
import { headers } from 'next/headers'
import React from 'react'

import { SiteFooter } from '@/components/SiteFooter'
import { SiteHeader } from '@/components/SiteHeader'
import { getLocale } from '@/lib/get-locale'

import './styles.css'

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale()
  const requestHeaders = await headers()
  const forwardedHost = requestHeaders.get('x-forwarded-host')?.split(',')[0]?.trim()
  const host = forwardedHost || requestHeaders.get('host') || 'localhost:3000'
  const forwardedProtocol = requestHeaders.get('x-forwarded-proto')?.split(',')[0]?.trim()
  const protocol = forwardedProtocol || (host.startsWith('localhost') ? 'http' : 'https')
  const baseURL = new URL(`${protocol}://${host}`)
  const description = locale === 'vi'
    ? 'Hồ Sơ Mở — báo chí điều tra độc lập, dựa trên dữ kiện, nguồn công khai và quyền phản hồi.'
    : 'Hồ Sơ Mở — independent investigative journalism built on evidence, public sources, and the right of reply.'

  return {
    metadataBase: baseURL,
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
          {locale === 'vi' ? 'Bỏ qua đến nội dung' : 'Skip to content'}
        </a>
        <SiteHeader locale={locale} />
        <main id="main-content">{children}</main>
        <SiteFooter locale={locale} />
      </body>
    </html>
  )
}
