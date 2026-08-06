'use client'

import { AppLayout } from '@/components/app-layout'
import { BatchHistory } from '@/components/batch-history'

export default function PipelinePage() {

  return (
    <AppLayout>
      <div className="space-y-8 p-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-foreground">Batch History</h1>
          <p className="mt-2 text-muted-foreground">
            Track tender data collection and ingestion runs
          </p>
        </div>

        {/* Batch History */}
        <BatchHistory />
      </div>
    </AppLayout>
  )
}
