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
        <div className="text-sm text-muted-foreground">Open Tenders</div>
        <div className="mt-2 text-3xl font-bold text-foreground">{stats.openTenders}</div>
        <div className="mt-1 text-xs text-muted-foreground">Available now</div>
      </Card>

      <Card className="p-6">
        <div className="text-sm text-muted-foreground">High Score</div>
        <div className="mt-2 text-3xl font-bold text-foreground">{stats.highScoreTenders}</div>
        <div className="mt-1 text-xs text-muted-foreground">Score ≥ 75</div>
      </Card>

      <Card className="p-6">
        <div className="text-sm text-muted-foreground">Avg. AI Score</div>
        <div className="mt-2 text-3xl font-bold text-foreground">{stats.averageScore}</div>
        <div className="mt-1 text-xs text-muted-foreground">Out of 100</div>
      </Card>
    </div>
  )
}
