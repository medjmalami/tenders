'use client'

import { AlertCircle, CheckCircle2, ChevronDown, ChevronUp, Clock } from 'lucide-react'
import { Fragment, useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import type { PipelineRun } from '@/lib/types'

interface PipelineRunsTableProps {
  runs: PipelineRun[]
}

export function PipelineRunsTable({ runs }: PipelineRunsTableProps) {
  const [expandedRunId, setExpandedRunId] = useState<string | null>(null)

  const getStatusBadge = (status: PipelineRun['status']) => {
    switch (status) {
      case 'completed':
      case 'success':
        return <Badge className="gap-1 bg-green-600"><CheckCircle2 className="h-3 w-3" /> Success</Badge>
      case 'failed':
        return <Badge variant="destructive" className="gap-1"><AlertCircle className="h-3 w-3" /> Failed</Badge>
      case 'running':
        return <Badge className="gap-1 bg-blue-600"><Clock className="h-3 w-3" /> Running</Badge>
      default:
        return <Badge>{status}</Badge>
    }
  }


  return (
    <Card>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-12"></TableHead>
            <TableHead>Run #</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Tenders</TableHead>
            <TableHead>Success</TableHead>
            <TableHead>Errors</TableHead>
            <TableHead>Started</TableHead>
            <TableHead>Duration</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {runs.map((run) => {
            const isExpanded = expandedRunId === run.id
            const duration = run.completedAt
              ? Math.round((run.completedAt.getTime() - run.startedAt.getTime()) / 1000)
              : 0
            const startedAtStr = run.startedAt.toLocaleString()

            return (
              <Fragment key={run.id}>
                <TableRow className="hover:bg-muted/50">
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0"
                      onClick={() =>
                        setExpandedRunId(isExpanded ? null : run.id)
                      }
                    >
                      {isExpanded ? (
                        <ChevronUp className="h-4 w-4" />
                      ) : (
                        <ChevronDown className="h-4 w-4" />
                      )}
                    </Button>
                  </TableCell>
                  <TableCell className="font-medium text-foreground">#{run.runNumber}</TableCell>
                  <TableCell>{getStatusBadge(run.status)}</TableCell>
                  <TableCell className="text-foreground">{run.tenderCount}</TableCell>
                  <TableCell>
                    <span className="text-green-600 font-medium">{run.successCount}</span>
                  </TableCell>
                  <TableCell>
                    <span className="text-red-600 font-medium">{run.errorCount}</span>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {startedAtStr}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {duration}s
                  </TableCell>
                </TableRow>

                {/* Expandable logs section */}
                {isExpanded && (
                  <TableRow className="bg-muted/30">
                    <TableCell colSpan={8} className="p-4">
                      <div className="space-y-3">
                        <h4 className="font-semibold text-foreground">Run Logs</h4>
                        <div className="space-y-2 max-h-96 overflow-y-auto rounded-lg bg-background p-3 font-mono text-xs">
                          {run.logs.map((log) => (
                            <div key={log.id} className="flex gap-2">
                              <span className="text-muted-foreground shrink-0">
                                {log.timestamp.toLocaleTimeString()}
                              </span>
                              <span
                                className={`shrink-0 font-semibold ${log.level === 'error'
                                  ? 'text-red-500'
                                  : log.level === 'warning'
                                    ? 'text-amber-500'
                                    : 'text-blue-500'
                                  }`}
                              >
                                [{log.level.toUpperCase()}]
                              </span>
                              <span className="text-foreground wrap-break-word">
                                {log.message}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </Fragment>
            )
          })}
        </TableBody>
      </Table>
    </Card>
  )
}
