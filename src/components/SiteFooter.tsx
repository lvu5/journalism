import Link from 'next/link'

import { commonCopy, type Locale } from '@/lib/i18n'

export function SiteFooter({ locale }: { locale: Locale }) {
  const copy = commonCopy[locale]

  return (
    <footer className="site-footer">
      <div className="shell footer-grid">
        <div>
          <p className="footer-brand">HỒ SƠ MỞ</p>
          {/* <p className="footer-mission">
            {copy.footerMission}
          </p> */}
        </div>
        <div className="footer-links">
          <Link href="/recent">{copy.recent}</Link>
          <Link href="/incidents">{copy.cases}</Link>
          <Link href="/timeline">{copy.byYear}</Link>
          <Link href="/guides">{copy.guides}</Link>
          <Link href="/admin">{copy.authorArea}</Link>
        </div>
      </div>
      <div className="shell footer-meta">
        <span>© 2026 Open Journalism</span>
      </div>
    </footer>
  )
}
