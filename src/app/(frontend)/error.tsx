'use client'

// Locale is read from the rendered <html lang> attribute because cookies are
// not reliably available in a client-side error boundary.
export default function ErrorPage({ reset }: { error: Error; reset: () => void }) {
  const isVietnamese =
    typeof document !== 'undefined' && document.documentElement.lang.startsWith('vi')

  return (
    <div className="listing-page shell">
      <div className="page-header">
        <h1>{isVietnamese ? 'Đã xảy ra lỗi' : 'Something went wrong'}</h1>
        <p>
          {isVietnamese
            ? 'Trang này gặp sự cố khi tải. Vui lòng thử lại.'
            : 'This page failed to load. Please try again.'}
        </p>
        <button className="primary-button" onClick={reset} type="button">
          <span>{isVietnamese ? 'Thử lại' : 'Try again'}</span>
        </button>
      </div>
    </div>
  )
}
