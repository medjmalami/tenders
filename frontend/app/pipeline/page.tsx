'use client'

import { AppLayout } from '@/components/app-layout'
import { PipelineHeader } from '@/components/pipeline-header'
import { PipelineRunsTable } from '@/components/pipeline-runs-table'
import { getPipelineRuns } from '@/lib/mock-data'

export default function PipelinePage() {
  const runs = getPipelineRuns()
  const lastRun = runs[0]

  return (
    <AppLayout>
      <div className="space-y-8 p-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-foreground">Pipeline Monitor</h1>
          <p className="mt-2 text-muted-foreground">
            Track data ingestion and tender processing jobs
          </p>
        </div>

        {/* Pipeline Controls */}
        <PipelineHeader lastRun={lastRun} />

        {/* Runs History */}
        <div>
          <h2 className="text-lg font-semibold text-foreground mb-4">
            Run History
          </h2>
          {runs.length > 0 ? (
            <PipelineRunsTable runs={runs} />
          ) : (
            <div className="rounded-lg border border-border bg-card p-12 text-center">
              <p className="text-muted-foreground">No pipeline runs yet.</p>
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  )
}
