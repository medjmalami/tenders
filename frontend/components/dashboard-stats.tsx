import { Card } from '@/components/ui/card'

interface DashboardStatsProps {
  totalTenders: number
  dueWithin7Days: number
  acceptedCount: number
}

export function DashboardStats({
  totalTenders,
  dueWithin7Days,
  acceptedCount,
}: DashboardStatsProps) {
  return (
    <div className="grid grid-cols-3 gap-4">
      <Card className="p-6">
        <div className="text-sm text-muted-foreground">Total Tenders</div>
        <div className="mt-2 text-3xl font-bold text-foreground">{totalTenders}</div>
        <div className="mt-1 text-xs text-muted-foreground">In database</div>
      </Card>
      <Card className="p-6">
        <div className="text-sm text-muted-foreground">Due Within 7 Days</div>
        <div className="mt-2 text-3xl font-bold text-foreground">{dueWithin7Days}</div>
        <div className="mt-1 text-xs text-muted-foreground">Deadline approaching</div>
      </Card>
      <Card className="p-6">
        <div className="text-sm text-muted-foreground">Accepted</div>
        <div className="mt-2 text-3xl font-bold text-foreground">{acceptedCount}</div>
        <div className="mt-1 text-xs text-muted-foreground">Approved tenders</div>
      </Card>
    </div>
  )
}
