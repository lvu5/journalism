import type { MetadataRoute } from 'next'
import config from '@payload-config'
import { getPayload } from 'payload'

// Dynamic: the sitemap must reflect newly published stories without a rebuild,
// and Payload cannot reach the database during a static build.
export const dynamic = 'force-dynamic'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
  const staticRoutes: MetadataRoute.Sitemap = ['', '/recent', '/incidents', '/timeline', '/guides'].map(
    (path) => ({ url: `${base}${path}` }),
  )

  try {
    const payload = await getPayload({ config })
    const [articles, incidents] = await Promise.all([
      payload.find({
        collection: 'articles',
        depth: 0,
        limit: 1000,
        overrideAccess: false,
        select: { slug: true, updatedAt: true },
      }),
      payload.find({
        collection: 'incidents',
        depth: 0,
        limit: 1000,
        overrideAccess: false,
        select: { slug: true, updatedAt: true },
      }),
    ])

    return [
      ...staticRoutes,
      ...articles.docs.map((article) => ({
        url: `${base}/articles/${article.slug}`,
        lastModified: article.updatedAt,
      })),
      ...incidents.docs.map((incident) => ({
        url: `${base}/incidents/${incident.slug}`,
        lastModified: incident.updatedAt,
      })),
    ]
  } catch (error) {
    // Serve at least the static routes when the database is unreachable.
    console.error('[sitemap] falling back to static routes', error)
    return staticRoutes
  }
}
