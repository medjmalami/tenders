import { Badge } from '@/components/ui/badge'
import type { TenderStatus } from '@/lib/types'

interface StatusBadgeProps {
  status: TenderStatus
  variant?: 'default' | 'secondary' | 'destructive' | 'outline'
}

const statusConfig: Record<TenderStatus, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  accepted: { label: 'Accepted', variant: 'default' },
  rejected: { label: 'Rejected', variant: 'destructive' },
  needs_more_data: { label: 'Needs More Data', variant: 'secondary' },
}

export function StatusBadge({ status, variant }: StatusBadgeProps) {
  const config = statusConfig[status]
  return <Badge variant={variant || config.variant}>{config.label}</Badge>
}
