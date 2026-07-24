'use client'

import { useState, useMemo } from 'react'
import { AppLayout } from '@/components/app-layout'
import { DashboardStats } from '@/components/dashboard-stats'
import { TenderFilters, type FilterState } from '@/components/tender-filters'
import { TenderTable } from '@/components/tender-table'
import { getTenders } from '@/lib/mock-data'
import type { Tender } from '@/lib/types'

export default function Dashboard() {
  const [filters, setFilters] = useState<FilterState>({
    statuses: ['open', 'closing_soon'],
    scoreMin: 0,
  })

  const allTenders = getTenders()

  // Filter tenders based on active filters
  const filteredTenders = useMemo(() => {
    return allTenders.filter((tender: Tender) => {
      // Status filter
      if (!filters.statuses.includes(tender.status)) {
        return false
      }

      // Category filter
      if (filters.category && tender.category !== filters.category) {
        return false
      }

      // Score filter
      if (tender.aiRankScore < filters.scoreMin) {
        return false
      }

      // Date range filter
      if (filters.dateRange) {
        if (
          tender.deadline < filters.dateRange.from ||
          tender.deadline > filters.dateRange.to
        ) {
          return false
        }
      }

      return true
    })
  }, [allTenders, filters])

  return (
    <AppLayout>
      <div className="space-y-8 p-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
          <p className="mt-2 text-muted-foreground">
            Overview of government tenders with AI-powered analysis
          </p>
        </div>

        {/* Stats */}
        <DashboardStats />

        {/* Filters */}
        <TenderFilters onFiltersChange={setFilters} />

        {/* Results */}
        <div>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-foreground">
              Tenders ({filteredTenders.length})
            </h2>
          </div>
          {filteredTenders.length > 0 ? (
            <TenderTable tenders={filteredTenders} />
          ) : (
            <div className="rounded-lg border border-border bg-card p-12 text-center">
              <p className="text-muted-foreground">No tenders match your filters.</p>
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  )
}
