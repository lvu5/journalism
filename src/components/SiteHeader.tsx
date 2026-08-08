'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'

import { commonCopy, localeCookieName, type Locale } from '@/lib/i18n'

export function SiteHeader({ locale }: { locale: Locale }) {
  const pathname = usePathname()
  const router = useRouter()
  const copy = commonCopy[locale]
  const navigation = [
    { href: '/recent', label: copy.recent },
    { href: '/incidents', label: copy.cases },
    { href: '/timeline', label: copy.byYear },
    { href: '/guides', label: copy.guides },
  ]

  const isActive = (href: string) => {
    if (href === '/recent') return pathname === '/recent' || pathname.startsWith('/articles/')
    if (href === '/incidents') return pathname.startsWith('/incidents')
    return pathname === href
  }

  const changeLocale = (nextLocale: Locale) => {
    document.cookie = `${localeCookieName}=${nextLocale}; Path=/; Max-Age=31536000; SameSite=Lax`
    document.documentElement.lang = nextLocale
    router.refresh()
  }

  return (
    <header className="site-header">
      <div className="utility-bar">
        <div className="shell utility-inner">
          <span className="utility-date">Open Journalism</span>
          <div className="language-switch" aria-label={copy.language} role="group">
            <button
              aria-pressed={locale === 'vi'}
              lang="vi"
              onClick={() => changeLocale('vi')}
              type="button"
            >
              VI
            </button>
            <span aria-hidden="true">/</span>
            <button
              aria-pressed={locale === 'en'}
              lang="en"
              onClick={() => changeLocale('en')}
              type="button"
            >
              EN
            </button>
          </div>
        </div>
      </div>
      <div className="shell masthead">
        <Link className="brand" href="/" aria-label={locale === 'vi' ? 'Hồ Sơ Mở — trang chủ' : 'Hồ Sơ Mở — home'}>
          <span className="brand-mark">HSM</span>
          <span className="brand-copy">
            <strong>Hồ Sơ Mở</strong>
            <small>{copy.tagline}</small>
          </span>
        </Link>
        <Link className="submit-link" href="/admin">
          {copy.submit} <span aria-hidden="true">↗</span>
        </Link>
      </div>
      <nav className="primary-nav" aria-label={copy.navigation}>
        <div className="shell nav-inner">
          {navigation.map((item, index) => (
            <Link
              aria-current={isActive(item.href) ? 'page' : undefined}
              href={item.href}
              key={item.href}
            >
              <span aria-hidden="true">0{index + 1}</span>
              {item.label}
            </Link>
          ))}
        </div>
      </nav>
    </header>
  )
}
