import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'

import { ArticleSubmissionForm } from '@/components/ArticleSubmissionForm'

afterEach(cleanup)

describe('Article submission citation rows', () => {
  it('adds and removes repeatable citation sources', () => {
    render(<ArticleSubmissionForm locale="en" />)

    expect(screen.getAllByLabelText('Source key')).toHaveLength(1)
    fireEvent.click(screen.getByRole('button', { name: '+ Add source' }))
    expect(screen.getAllByLabelText('Source key')).toHaveLength(2)

    fireEvent.click(screen.getAllByRole('button', { name: 'Remove' })[0])
    expect(screen.getAllByLabelText('Source key')).toHaveLength(1)
  })

  it('provides Markdown formatting controls and a rendered citation preview', () => {
    render(<ArticleSubmissionForm locale="en" />)
    const editor = screen.getByLabelText('Article (Markdown)')
    const sourceKey = screen.getByLabelText('Source key')

    fireEvent.click(screen.getByTitle('Citation'))
    expect((editor as HTMLTextAreaElement).value).toBe(String.raw`\cite{source-key}`)

    fireEvent.change(sourceKey, { target: { value: 'court-record' } })
    fireEvent.change(editor, {
      target: {
        value: String.raw`## Finding

The record supports this statement. \cite{court-record}`,
      },
    })
    fireEvent.click(screen.getByRole('tab', { name: 'Preview' }))

    expect(screen.getByRole('heading', { name: 'Finding' })).toBeTruthy()
    expect(screen.getByRole('link', { name: '[1]' }).getAttribute('href')).toBe(
      '#citation-court-record',
    )
  })

  it('autocompletes a citation key at the cursor', () => {
    render(<ArticleSubmissionForm locale="en" />)
    const editor = screen.getByLabelText('Article (Markdown)') as HTMLTextAreaElement

    fireEvent.change(screen.getByLabelText('Source key'), {
      target: { value: 'court-record' },
    })
    fireEvent.change(editor, { target: { value: String.raw`Evidence \cite{co}` } })
    editor.setSelectionRange(editor.value.length - 1, editor.value.length - 1)
    fireEvent.select(editor)

    expect(screen.getByRole('option', { name: 'court-record' })).toBeTruthy()
    fireEvent.keyDown(editor, { key: 'Enter' })
    expect(editor.value).toBe(String.raw`Evidence \cite{court-record}`)
  })

  it('disables only new draft saves once the ten-draft limit is reached', () => {
    render(<ArticleSubmissionForm draftCount={10} locale="en" />)

    const saveDraft = screen.getByRole('button', { name: 'Save draft' }) as HTMLButtonElement
    const submit = screen.getByRole('button', { name: 'Submit for review' }) as HTMLButtonElement

    expect(saveDraft.disabled).toBe(true)
    expect(saveDraft.formNoValidate).toBe(true)
    expect(submit.disabled).toBe(false)
  })

  it('reopens an existing draft even when all ten draft slots are occupied', () => {
    render(
      <ArticleSubmissionForm
        draftCount={10}
        initialArticle={{
          bodyMarkdown: 'A saved lead',
          citations: [
            {
              accessedAt: '2026-08-18T00:00:00.000Z',
              citationKey: 'saved-source',
              sourceTitle: 'Saved source',
              url: 'https://example.com/saved',
            },
          ],
          eventDate: '2026-08-17T00:00:00.000Z',
          id: 42,
          summary: 'Saved summary',
          title: 'Saved investigation',
        }}
        locale="en"
      />,
    )

    expect((screen.getByLabelText('Title') as HTMLInputElement).value).toBe('Saved investigation')
    expect((screen.getByLabelText('Source key') as HTMLInputElement).value).toBe('saved-source')
    expect((screen.getByRole('button', { name: 'Save draft' }) as HTMLButtonElement).disabled).toBe(
      false,
    )
  })
})
