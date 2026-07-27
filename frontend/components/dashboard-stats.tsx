import { Card } from '@/components/ui/card'
import { getDashboardStats } from '@/lib/mock-data'

export function DashboardStats() {
  const stats = getDashboardStats()

  return (
    <div className="grid grid-cols-4 gap-4">
      <Card className="p-6">
        <div className="text-sm text-muted-foreground">Total Tenders</div>
        <div className="mt-2 text-3xl font-bold text-foreground">{stats.totalTenders}</div>
        <div className="mt-1 text-xs text-muted-foreground">In database</div>
      </Card>

      <Card className="p-6">
        <div className="text-sm text-muted-foreground">Needs More Data</div>
        <div className="mt-2 text-3xl font-bold text-foreground">{stats.needsMoreDataCount}</div>
        <div className="mt-1 text-xs text-muted-foreground">Awaiting review</div>
      </Card>

      <Card className="p-6">
        <div className="text-sm text-muted-foreground">Due Within 7 Days</div>
        <div className="mt-2 text-3xl font-bold text-foreground">{stats.dueWithin7Days}</div>
        <div className="mt-1 text-xs text-muted-foreground">Deadline approaching</div>
      </Card>

      <Card className="p-6">
        <div className="text-sm text-muted-foreground">Accepted</div>
        <div className="mt-2 text-3xl font-bold text-foreground">{stats.acceptedCount}</div>
        <div className="mt-1 text-xs text-muted-foreground">Approved tenders</div>
      </Card>
    </div>
  )
}
