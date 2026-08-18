import { describe, expect, it } from 'vitest'

import { submitArticle } from '@/app/(frontend)/author/articles/new/actions'
import { initialArticleSubmissionState } from '@/lib/article-submission-state'
import {
  extractCitationKeys,
  findUnknownCitationKeys,
  renderCitationReferences,
} from '@/lib/citations'

const submissionForm = (bodyMarkdown: string, citationKeys: string[]) => {
  const form = new FormData()
  form.set('locale', 'en')
  form.set('title', 'A documented test article')
  form.set('eventDate', '2026-08-18')
  form.set('summary', 'A sufficiently detailed summary for citation validation.')
  form.set('bodyMarkdown', bodyMarkdown.padEnd(120, ' reporting'))
  citationKeys.forEach((key, index) => {
    form.append('citationKey', key)
    form.append('citationTitle', `Source ${index + 1}`)
    form.append('citationUrl', `https://example.com/source-${index + 1}`)
    form.append('citationAccessedAt', '2026-08-18')
  })
  return form
}

describe('Article citation syntax', () => {
  it('extracts and normalizes one or several LaTeX-style citation keys', () => {
    const markdown = String.raw`Claim one \cite{Court-Record}. Claim two \cite{budget-2025, data_sheet}.`

    expect(extractCitationKeys(markdown)).toEqual(['court-record', 'budget-2025', 'data_sheet'])
  })

  it('reports citation keys that have no matching source', () => {
    const markdown = String.raw`A documented statement \cite{known,missing}.`

    expect(findUnknownCitationKeys(markdown, ['known'])).toEqual(['missing'])
  })

  it('turns citations into numbered links and leaves escaped examples alone', () => {
    const markdown = String.raw`Finding \cite{record,data}. Example: \\cite{literal}.`
    const rendered = renderCitationReferences(markdown, [
      { citationKey: 'record' },
      { citationKey: 'data' },
    ])

    expect(rendered).toBe(
      String.raw`Finding [[1]](#citation-record)[[2]](#citation-data). Example: \\cite{literal}.`,
    )
  })

  it('rejects unknown inline keys before creating an article', async () => {
    const result = await submitArticle(
      initialArticleSubmissionState,
      submissionForm(String.raw`This statement has a source \cite{missing}.`, ['known']),
    )

    expect(result.fieldErrors?.bodyMarkdown).toContain('missing')
  })

  it('rejects duplicate source keys before creating an article', async () => {
    const result = await submitArticle(
      initialArticleSubmissionState,
      submissionForm(String.raw`This statement has a source \cite{same}.`, ['same', 'same']),
    )

    expect(result.fieldErrors?.citations).toMatch(/unique/)
  })
})
