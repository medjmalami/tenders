'use client'

import { Card } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import type { Batch } from '@/lib/types'

interface BatchHistoryProps {
  batches: Batch[]
}

export function BatchHistory({ batches }: BatchHistoryProps) {
  return (
    <div className="space-y-6">
      {/* Latest Batch Summary */}
      {batches.length > 0 && (
        <Card className="p-6 bg-blue-50 dark:bg-blue-950">
          <div className="grid grid-cols-3 gap-6">
            <div>
              <p className="text-xs text-muted-foreground">Latest Run #</p>
              <p className="mt-2 text-3xl font-bold text-foreground">{batches[0].runNumber}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Run Date</p>
              <p className="mt-2 text-lg font-semibold text-foreground">
                {new Date(batches[0].runDate).toLocaleDateString()}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Tenders Found</p>
              <p className="mt-2 text-3xl font-bold text-foreground">{batches[0].tendersFoundCount}</p>
            </div>
          </div>
        </Card>
      )}

      {/* Batch History Table */}
      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Run #</TableHead>
              <TableHead>Run Date</TableHead>
              <TableHead>Target Date</TableHead>
              <TableHead>Tenders Found</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {batches.map((batch) => (
              <TableRow key={batch.id} className="hover:bg-muted/50">
                <TableCell className="font-medium text-foreground">{batch.runNumber}</TableCell>
                <TableCell>{new Date(batch.runDate).toLocaleDateString()}</TableCell>
                <TableCell>{new Date(batch.targetDate).toLocaleDateString()}</TableCell>
                <TableCell className="text-sm text-muted-foreground">{batch.tendersFoundCount}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  )
}
