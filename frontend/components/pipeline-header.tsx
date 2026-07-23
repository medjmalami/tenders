'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Play, CheckCircle2, AlertCircle } from 'lucide-react'
import { toast } from 'sonner'
import type { PipelineRun } from '@/lib/types'

interface PipelineHeaderProps {
  lastRun?: PipelineRun
}

export function PipelineHeader({ lastRun }: PipelineHeaderProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [completedAtStr, setCompletedAtStr] = useState<string>('')

  useEffect(() => {
    if (lastRun?.completedAt) {
      setCompletedAtStr(lastRun.completedAt.toLocaleString())
    }
  }, [lastRun?.completedAt])

  const handleRunNow = async () => {
    setIsLoading(true)
    toast.loading('Pipeline running...')

    // Simulate a brief loading state
    setTimeout(() => {
      setIsLoading(false)
      toast.success('Pipeline completed successfully')
    }, 2000)
  }

  return (
    <div className="space-y-4">
      {/* Run Now Section */}
      <Card className="bg-blue-50 p-6 dark:bg-blue-950">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-foreground">Data Pipeline</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Fetch and analyze new government tenders
            </p>
          </div>
          <Button
            onClick={handleRunNow}
            disabled={isLoading}
            className="gap-2 bg-blue-600 hover:bg-blue-700"
          >
            <Play className="h-4 w-4" />
            {isLoading ? 'Running...' : 'Run Now'}
          </Button>
        </div>
      </Card>

      {/* Last Run Summary */}
      {lastRun && (
        <Card className="p-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-foreground">Last Run Summary</h3>
              <Badge className="gap-1 bg-green-600">
                <CheckCircle2 className="h-3 w-3" />
                {lastRun.status}
              </Badge>
            </div>

            <div className="grid grid-cols-4 gap-4">
              <div>
                <p className="text-xs text-muted-foreground">Run Number</p>
                <p className="text-lg font-bold text-foreground mt-1">#{lastRun.runNumber}</p>
              </div>

              <div>
                <p className="text-xs text-muted-foreground">Tenders Processed</p>
                <p className="text-lg font-bold text-foreground mt-1">{lastRun.tenderCount}</p>
              </div>

              <div>
                <p className="text-xs text-muted-foreground">Success</p>
                <p className="text-lg font-bold text-green-600 mt-1">
                  {lastRun.successCount}
                </p>
              </div>

              <div>
                <p className="text-xs text-muted-foreground">Errors</p>
                <p className={`text-lg font-bold mt-1 ${lastRun.errorCount > 0 ? 'text-red-600' : 'text-green-600'}`}>
                  {lastRun.errorCount}
                </p>
              </div>
            </div>

            <div className="border-t border-border pt-3 text-xs text-muted-foreground">
              Completed at {completedAtStr || '—'}
            </div>

            {lastRun.errorCount > 0 && (
              <div className="flex items-start gap-2 rounded-lg bg-red-50 p-3 dark:bg-red-950">
                <AlertCircle className="h-4 w-4 flex-shrink-0 text-red-600 mt-0.5" />
                <p className="text-sm text-red-600">
                  {lastRun.errorCount} error(s) occurred during processing
                </p>
              </div>
            )}
          </div>
        </Card>
      )}
    </div>
  )
}
