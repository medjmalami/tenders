import { Badge } from '@/components/ui/badge'
import type { TenderStatus } from '@/lib/types'

interface StatusBadgeProps {
  status: TenderStatus
  variant?: 'default' | 'secondary' | 'destructive' | 'outline'
}

const statusConfig: Record<TenderStatus, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  open: { label: 'Open', variant: 'default' },
  closing_soon: { label: 'Closing Soon', variant: 'destructive' },
  closed: { label: 'Closed', variant: 'secondary' },
  awarded: { label: 'Awarded', variant: 'outline' },
}

export function StatusBadge({ status, variant }: StatusBadgeProps) {
  const config = statusConfig[status]
  return <Badge variant={variant || config.variant}>{config.label}</Badge>
}
