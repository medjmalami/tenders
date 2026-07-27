'use client'

import { useState, useMemo } from 'react'
import { AppLayout } from '@/components/app-layout'
import { DashboardStats } from '@/components/dashboard-stats'
import { TenderFilters, type FilterState } from '@/components/tender-filters'
import { TenderTable } from '@/components/tender-table'
import { getAllTenders } from '@/lib/mock-data'
import type { Tender } from '@/lib/types'

export default function Dashboard() {
  const [filters, setFilters] = useState<FilterState>({
    statuses: [],
  })

  const allTenders = getAllTenders()

  // Filter and sort tenders based on active filters
  const filteredTenders = useMemo(() => {
    let tenders = allTenders.filter((tender: Tender) => {
      // Status filter
      if (filters.statuses.length > 0 && !filters.statuses.includes(tender.status)) {
        return false
      }

      // Institution filter
      if (filters.institution && tender.institution !== filters.institution) {
        return false
      }

      // Date range filter
      if (filters.dateRange && tender.finalSubmissionDate) {
        const deadline = new Date(tender.finalSubmissionDate)
        if (deadline < filters.dateRange.from || deadline > filters.dateRange.to) {
          return false
        }
      }

      return true
    })

    // Sort by deadline (soonest first)
    tenders.sort((a, b) => {
      const dateA = a.finalSubmissionDate ? new Date(a.finalSubmissionDate).getTime() : Infinity
      const dateB = b.finalSubmissionDate ? new Date(b.finalSubmissionDate).getTime() : Infinity
      return dateA - dateB
    })

    return tenders
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
