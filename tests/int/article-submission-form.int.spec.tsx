import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { ArticleSubmissionForm } from '@/components/ArticleSubmissionForm'

describe('Article submission citation rows', () => {
  it('adds and removes repeatable citation sources', () => {
    render(<ArticleSubmissionForm locale="en" />)

    expect(screen.getAllByLabelText('Source key')).toHaveLength(1)
    fireEvent.click(screen.getByRole('button', { name: '+ Add source' }))
    expect(screen.getAllByLabelText('Source key')).toHaveLength(2)

    fireEvent.click(screen.getAllByRole('button', { name: 'Remove' })[0])
    expect(screen.getAllByLabelText('Source key')).toHaveLength(1)
  })
})
