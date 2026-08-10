// @vitest-environment node
import React from 'react'
import { render } from 'ink-testing-library'

import { describe, expect, it } from 'vitest'

import { StatusBadge } from '@/tui/components/StatusBadge'
import { Queue } from '@/tui/views/Queue'
import type { QueueItem } from '@/tui/api'

const item: QueueItem = {
  id: 42,
  title: 'Suspicious procurement records',
  incidentTitle: 'Case 42',
  incident: 7,
  contributionType: 'document',
  description: 'desc',
  contactEmail: 'x@y.z',
  consentToReview: true,
  reviewStatus: 'received',
  publishInCase: false,
  publishName: false,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
}

describe('TUI components', () => {
  it('renders queue items with titles and the case name', () => {
    const { lastFrame } = render(
      <Queue filter="pending" isLoading={false} items={[item]} onOpen={() => undefined} />,
    )
    expect(lastFrame()).toContain('Suspicious procurement records')
    expect(lastFrame()).toContain('Case 42')
  })

  it('renders the empty state', () => {
    const { lastFrame } = render(
      <Queue filter="pending" isLoading={false} items={[]} onOpen={() => undefined} />,
    )
    expect(lastFrame()).toContain('queue is empty')
  })

  it('renders status badges', () => {
    const { lastFrame } = render(<StatusBadge status="needs-info" />)
    expect(lastFrame()).toMatch(/needs info/i)
  })
})
