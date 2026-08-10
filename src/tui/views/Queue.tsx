import React from 'react'
import { Box, Text } from 'ink'
import { Select } from '@inkjs/ui'

import type { QueueFilter, QueueItem } from '../api'
import { StatusBadge } from '../components/StatusBadge'

type QueueProps = {
  filter: QueueFilter
  isLoading: boolean
  items: QueueItem[]
  onOpen: (item: QueueItem) => void
}

const FILTERS: { label: string; value: QueueFilter; key: string }[] = [
  { label: 'Pending', value: 'pending', key: 'p' },
  { label: 'Approved', value: 'approved', key: 'a' },
  { label: 'Not used', value: 'rejected', key: 'r' },
  { label: 'All', value: 'all', key: 'l' },
]

export function Queue({ filter, isLoading, items, onOpen }: QueueProps) {
  return (
    <Box flexDirection="column">
      <Box gap={2} marginBottom={1}>
        {FILTERS.map((f) => (
          <Text key={f.value} bold={filter === f.value} color={filter === f.value ? 'cyan' : 'gray'}>
            [{f.key}] {f.label}
          </Text>
        ))}
      </Box>

      {isLoading ? (
        <Text color="gray">Loading…</Text>
      ) : items.length === 0 ? (
        <Text color="gray">The queue is empty — nothing to triage here.</Text>
      ) : (
        <Select
          options={items.map((item) => ({
            label: `${item.title} · ${item.incidentTitle}`,
            value: String(item.id),
          }))}
          onChange={(value) => {
            const item = items.find((candidate) => String(candidate.id) === value)
            if (item) onOpen(item)
          }}
        />
      )}

      <Box marginTop={1} gap={1}>
        <Text dimColor>{items.length} item(s)</Text>
        <StatusBadge status="received" />
        <Text dimColor>↑/↓ + Enter to open · q to go back</Text>
      </Box>
    </Box>
  )
}
