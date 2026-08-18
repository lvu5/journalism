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
})
