import config from '@payload-config'
import { getPayload } from 'payload'

import type { Article, CommunityContribution, Incident } from '@/payload-types'

import type {
  ArticleView,
  CommunityContributionView,
  IncidentDetailView,
  IncidentView,
} from './content'
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

export async function getArticles(limit = 12): Promise<ArticleView[]> {
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
  } catch {
    // The public shell remains useful while a new developer is starting PostgreSQL.
  }
  return demoArticles.slice(0, limit)
}

export async function getArticleBySlug(slug: string): Promise<ArticleView | null> {
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
  } catch {
    // Fall through to clearly marked demonstration content.
  }
  return demoArticles.find((article) => article.slug === slug) || null
}

export async function getIncidents(limit = 50): Promise<IncidentView[]> {
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
  } catch {
    // Fall through to clearly marked demonstration content.
  }
  return demoIncidents.slice(0, limit)
}

export async function getIncidentBySlug(slug: string): Promise<IncidentDetailView | null> {
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
  } catch {
    // Fall through to clearly marked demonstration content.
  }

  const incident = demoIncidents.find((item) => item.slug === slug)
  if (!incident) return null
  return {
    ...incident,
    approvedContributions: demoContributions[slug] || [],
  }
}
