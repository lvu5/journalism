import Link from 'next/link'

import { getLocale } from '@/lib/get-locale'

export default async function NotFound() {
  const locale = await getLocale()

  return (
    <div className="listing-page shell">
      <div className="page-header">
        <h1>{locale === 'vi' ? 'Không tìm thấy trang' : 'Page not found'}</h1>
        <p>
          {locale === 'vi'
            ? 'Đường dẫn này không tồn tại hoặc nội dung đã được gỡ xuống.'
            : 'This link does not exist, or the content has been taken down.'}
        </p>
        <Link className="text-link" href="/">
          {locale === 'vi' ? 'Về trang chủ' : 'Back to the homepage'} →
        </Link>
      </div>
    </div>
  )
}
