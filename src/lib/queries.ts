import config from '@payload-config'
import { getPayload } from 'payload'
import { cache } from 'react'

import type { Article, CommunityContribution, Incident } from '@/payload-types'

import type {
  ArticleView,
  CommunityContributionView,
  IncidentDetailView,
  IncidentView,
} from './content'
import { caseStatusLabels } from './content'
import { demoArticles, demoContributions, demoIncidents } from './demo-content'

const relationName = (value: unknown): string | null => {
  if (!value || typeof value !== 'object' || !('publicName' in value)) return null
  const name = value.publicName
  return typeof name === 'string' ? name : null
}

const mapArticle = (article: Article): ArticleView => ({
  id: article.id,
  slug: article.slug,
  title: article.title,
  summary: article.summary,
  bodyMarkdown: article.bodyMarkdown,
  eventDate: article.eventDate,
  publishedAt: article.publishedAt || article.updatedAt,
  topics: article.topics || [],
  byline: [
    ...(article.byline?.map((entry) => entry.name) || []),
    ...(article.authors?.map(relationName).filter((name): name is string => Boolean(name)) || []),
  ],
  citations: (article.citations || []).map((citation) => ({
    sourceTitle: citation.sourceTitle,
    publisher: citation.publisher,
    url: citation.url,
    accessedAt: citation.accessedAt,
    archiveUrl: citation.archiveUrl,
    note: citation.note,
  })),
  featured: article.featured || false,
})

const mapIncident = (incident: Incident): IncidentView => ({
  id: incident.id,
  slug: incident.slug,
  title: incident.title,
  summary: incident.summary,
  notabilityReason: incident.notabilityReason,
  dateStart: incident.dateStart,
  dateEnd: incident.dateEnd,
  location: incident.location,
  caseStatus: incident.caseStatus,
  crowdsourcingEnabled: incident.crowdsourcingEnabled || false,
  status: incident.verificationStatus,
  severity: incident.severity,
  citations: (incident.citations || []).map((citation) => ({
    sourceTitle: citation.sourceTitle,
    url: citation.url,
    accessedAt: citation.accessedAt,
    archiveUrl: citation.archiveUrl,
  })),
  citationCount: incident.citations?.length || 0,
  featured: incident.featured || false,
})

const mapContribution = (contribution: CommunityContribution): CommunityContributionView => ({
  id: contribution.id,
  title: contribution.title,
  description: contribution.description,
  contributionType: contribution.contributionType,
  sourceUrl: contribution.sourceUrl,
  contributorName: contribution.contributorName,
  approvedAt: contribution.approvedAt,
})

export type Paginated<T> = {
  items: T[]
  page: number
  totalDocs: number
  totalPages: number
}

const paginateDemo = <T>(items: T[], page: number, limit: number): Paginated<T> => {
  const totalDocs = items.length
  const totalPages = Math.max(1, Math.ceil(totalDocs / limit))
  const safePage = Math.min(Math.max(1, page), totalPages)
  return {
    items: items.slice((safePage - 1) * limit, safePage * limit),
    page: safePage,
    totalDocs,
    totalPages,
  }
}

// React cache() dedupes these within a single request — generateMetadata and
// the page render no longer each issue their own queries.
export const getArticles = cache(async (limit = 12): Promise<ArticleView[]> => {
  try {
    const payload = await getPayload({ config })
    const result = await payload.find({
      collection: 'articles',
      depth: 1,
      limit,
      overrideAccess: false,
      sort: '-publishedAt',
    })
    if (result.docs.length) return result.docs.map(mapArticle)
  } catch (error) {
    // The public shell remains useful while a new developer is starting PostgreSQL.
    console.error('[queries] getArticles failed; serving demo content', error)
  }
  return demoArticles.slice(0, limit)
})

export const getArticlesPage = cache(
  async (page = 1, limit = 12): Promise<Paginated<ArticleView>> => {
    try {
      const payload = await getPayload({ config })
      const result = await payload.find({
        collection: 'articles',
        depth: 1,
        limit,
        page,
        overrideAccess: false,
        sort: '-publishedAt',
      })
      if (result.totalDocs > 0) {
        return {
          items: result.docs.map(mapArticle),
          page: result.page ?? 1,
          totalDocs: result.totalDocs,
          totalPages: result.totalPages ?? 1,
        }
      }
    } catch (error) {
      // Fall through to clearly marked demonstration content.
      console.error('[queries] getArticlesPage failed; serving demo content', error)
    }
    return paginateDemo(demoArticles, page, limit)
  },
)

export const getArticleBySlug = cache(async (slug: string): Promise<ArticleView | null> => {
  try {
    const payload = await getPayload({ config })
    const result = await payload.find({
      collection: 'articles',
      depth: 1,
      limit: 1,
      overrideAccess: false,
      where: { slug: { equals: slug } },
    })
    if (result.docs[0]) return mapArticle(result.docs[0])
  } catch (error) {
    // Fall through to clearly marked demonstration content.
    console.error('[queries] getArticleBySlug failed; serving demo content', error)
  }
  return demoArticles.find((article) => article.slug === slug) || null
})

// Explicit featured lookup: a featured story older than the latest N must
// still be found. Returns null (not demo content) when the database is
// reachable but nothing is featured.
export const getFeaturedArticle = cache(async (): Promise<ArticleView | null> => {
  try {
    const payload = await getPayload({ config })
    const result = await payload.find({
      collection: 'articles',
      depth: 1,
      limit: 1,
      overrideAccess: false,
      sort: '-publishedAt',
      where: { featured: { equals: true } },
    })
    return result.docs[0] ? mapArticle(result.docs[0]) : null
  } catch (error) {
    console.error('[queries] getFeaturedArticle failed; serving demo content', error)
    return demoArticles.find((article) => article.featured) || null
  }
})

export const getIncidents = cache(async (limit = 50): Promise<IncidentView[]> => {
  try {
    const payload = await getPayload({ config })
    const result = await payload.find({
      collection: 'incidents',
      depth: 0,
      limit,
      overrideAccess: false,
      sort: '-dateStart',
    })
    if (result.docs.length) return result.docs.map(mapIncident)
  } catch (error) {
    // Fall through to clearly marked demonstration content.
    console.error('[queries] getIncidents failed; serving demo content', error)
  }
  return demoIncidents.slice(0, limit)
})

export const getIncidentsPage = cache(
  async (
    page = 1,
    limit = 12,
    caseStatus?: IncidentView['caseStatus'],
  ): Promise<Paginated<IncidentView>> => {
    try {
      const payload = await getPayload({ config })
      const result = await payload.find({
        collection: 'incidents',
        depth: 0,
        limit,
        page,
        overrideAccess: false,
        sort: '-dateStart',
        ...(caseStatus ? { where: { caseStatus: { equals: caseStatus } } } : {}),
      })
      // An actively filtered empty result is real — never mix demo cases into it.
      if (result.totalDocs > 0 || caseStatus) {
        return {
          items: result.docs.map(mapIncident),
          page: result.page ?? 1,
          totalDocs: result.totalDocs,
          totalPages: result.totalPages ?? 1,
        }
      }
    } catch (error) {
      // Fall through to clearly marked demonstration content.
      console.error('[queries] getIncidentsPage failed; serving demo content', error)
    }
    const filtered = caseStatus
      ? demoIncidents.filter((incident) => incident.caseStatus === caseStatus)
      : demoIncidents
    return paginateDemo(filtered, page, limit)
  },
)

export const getIncidentStatusCounts = cache(
  async (): Promise<Record<IncidentView['caseStatus'], number>> => {
    const statuses = Object.keys(caseStatusLabels.vi) as IncidentView['caseStatus'][]
    try {
      const payload = await getPayload({ config })
      const entries = await Promise.all(
        statuses.map(async (status) => {
          const result = await payload.count({
            collection: 'incidents',
            overrideAccess: false,
            where: { caseStatus: { equals: status } },
          })
          return [status, result.totalDocs] as const
        }),
      )
      if (entries.some(([, total]) => total > 0)) {
        return Object.fromEntries(entries) as Record<IncidentView['caseStatus'], number>
      }
    } catch (error) {
      // Fall through to demonstration counts.
      console.error('[queries] getIncidentStatusCounts failed; serving demo counts', error)
    }
    return Object.fromEntries(
      statuses.map((status) => [
        status,
        demoIncidents.filter((incident) => incident.caseStatus === status).length,
      ]),
    ) as Record<IncidentView['caseStatus'], number>
  },
)

export const getFeaturedIncident = cache(async (): Promise<IncidentView | null> => {
  try {
    const payload = await getPayload({ config })
    const result = await payload.find({
      collection: 'incidents',
      depth: 0,
      limit: 1,
      overrideAccess: false,
      sort: '-dateStart',
      where: { featured: { equals: true } },
    })
    return result.docs[0] ? mapIncident(result.docs[0]) : null
  } catch (error) {
    console.error('[queries] getFeaturedIncident failed; serving demo content', error)
    return demoIncidents.find((incident) => incident.featured) || null
  }
})

export const getIncidentBySlug = cache(
  async (slug: string): Promise<IncidentDetailView | null> => {
    try {
      const payload = await getPayload({ config })
      const incidentResult = await payload.find({
        collection: 'incidents',
        depth: 0,
        limit: 1,
        overrideAccess: false,
        where: { slug: { equals: slug } },
      })
      const incident = incidentResult.docs[0]
      if (incident) {
        const contributionResult = await payload.find({
          collection: 'community-contributions',
          depth: 0,
          limit: 100,
          overrideAccess: false,
          sort: 'approvedAt',
          where: { incident: { equals: incident.id } },
        })

        return {
          ...mapIncident(incident),
          approvedContributions: contributionResult.docs.map(mapContribution),
        }
      }
    } catch (error) {
      // Fall through to clearly marked demonstration content.
      console.error('[queries] getIncidentBySlug failed; serving demo content', error)
    }

    const incident = demoIncidents.find((item) => item.slug === slug)
    if (!incident) return null
    return {
      ...incident,
      approvedContributions: demoContributions[slug] || [],
    }
  },
)
