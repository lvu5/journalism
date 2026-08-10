import React from 'react'
import { Badge } from '@inkjs/ui'

import type { CommunityContribution } from '../../payload-types'

const colors: Record<CommunityContribution['reviewStatus'], string> = {
  received: 'yellow',
  screening: 'blue',
  'needs-info': 'magenta',
  approved: 'green',
  rejected: 'gray',
}

const labels: Record<CommunityContribution['reviewStatus'], string> = {
  received: 'Received',
  screening: 'Screening',
  'needs-info': 'Needs info',
  approved: 'Approved',
  rejected: 'Not used',
}

export function StatusBadge({ status }: { status: CommunityContribution['reviewStatus'] }) {
  return <Badge color={colors[status]}>{labels[status]}</Badge>
}
