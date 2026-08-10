import type { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  // Demo content is dev-only; if it is force-enabled in production the pages
  // are noindexed (layout.tsx) and crawling is blocked entirely here.
  if (process.env.ENABLE_DEMO_CONTENT === 'true') {
    return { rules: { userAgent: '*', disallow: '/' } }
  }

  const base = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'

  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/admin', '/api'],
    },
    sitemap: `${base}/sitemap.xml`,
  }
}
