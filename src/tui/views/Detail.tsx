import React, { useState } from 'react'
import { Box, Text, useInput } from 'ink'
import { Badge, TextInput } from '@inkjs/ui'

import type { QueueItem, ReviewStatus } from '../api'
import { StatusBadge } from '../components/StatusBadge'

type DetailProps = {
  busy: boolean
  item: QueueItem
  message: string
  onAction: (status: ReviewStatus) => void
  onBack: () => void
  onSaveNotes: (notes: string) => void
  onTogglePublish: () => void
}

export function Detail({
  busy,
  item,
  message,
  onAction,
  onBack,
  onSaveNotes,
  onTogglePublish,
}: DetailProps) {
  const [editingNotes, setEditingNotes] = useState(false)
  const canPublish = item.reviewStatus === 'approved'

  useInput((input) => {
    if (busy || editingNotes) return
    if (input === 'q') return onBack()
    const actions: Record<string, ReviewStatus> = {
      s: 'screening',
      i: 'needs-info',
      a: 'approved',
      r: 'rejected',
    }
    if (input in actions) return onAction(actions[input])
    if (input === 'p') return onTogglePublish()
    if (input === 'e') setEditingNotes(true)
  })

  return (
    <Box flexDirection="column">
      <Box gap={1} marginBottom={1}>
        <StatusBadge status={item.reviewStatus} />
        {item.publishInCase ? <Badge color="green">public</Badge> : null}
        <Text bold>{item.title}</Text>
      </Box>

      <Text dimColor>
        Case: {item.incidentTitle} · Type: {item.contributionType} · ID: {item.id}
      </Text>
      {item.contributorName ? <Text>Contributor: {item.contributorName}</Text> : null}
      {item.contactEmail ? <Text>Contact: {item.contactEmail}</Text> : null}
      {item.sourceUrl ? <Text>Source: {item.sourceUrl}</Text> : null}

      <Box marginTop={1} flexDirection="column">
        <Text bold>Contribution</Text>
        <Text wrap="wrap">{item.description}</Text>
      </Box>

      <Box marginTop={1} flexDirection="column">
        <Text bold>Reviewer notes (private)</Text>
        {editingNotes ? (
          <TextInput
            defaultValue={item.reviewerNotes ?? ''}
            onSubmit={(value) => {
              setEditingNotes(false)
              onSaveNotes(value)
            }}
            placeholder="Notes…"
          />
        ) : (
          <Text dimColor>{item.reviewerNotes || '—'}</Text>
        )}
      </Box>

      {message ? (
        <Box marginTop={1}>
          <Text color="yellow">{message}</Text>
        </Box>
      ) : null}

      <Box marginTop={1} flexDirection="column">
        <Text dimColor>
          [s] screening · [i] needs info · [a] approve · [r] not used · [p] toggle public
          {canPublish ? '' : ' (approved only)'} · [e] edit notes · [q] back
        </Text>
        {busy ? <Text color="gray">Working…</Text> : null}
      </Box>
    </Box>
  )
}
