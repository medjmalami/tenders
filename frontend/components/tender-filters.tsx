'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import type { TenderStatus } from '@/lib/types'

interface TenderFiltersProps {
  onFiltersChange?: (filters: FilterState) => void
}

export interface FilterState {
  statuses: TenderStatus[]
  institution?: string
  dateRange?: { from: Date; to: Date }
}

const statusOptions: TenderStatus[] = ['accepted', 'rejected', 'needs_more_data']

export function TenderFilters({ onFiltersChange }: TenderFiltersProps) {
  const [filters, setFilters] = useState<FilterState>({
    statuses: [],
  })

  const [showDatePicker, setShowDatePicker] = useState(false)
  const [dateFrom, setDateFrom] = useState<Date | undefined>()
  const [dateTo, setDateTo] = useState<Date | undefined>()

  const handleStatusToggle = (status: TenderStatus) => {
    const newStatuses = filters.statuses.includes(status)
      ? filters.statuses.filter((s) => s !== status)
      : [...filters.statuses, status]

    const newFilters = { ...filters, statuses: newStatuses }
    setFilters(newFilters)
    onFiltersChange?.(newFilters)
  }

  const handleDateRangeSet = () => {
    if (dateFrom && dateTo) {
      const newFilters = { ...filters, dateRange: { from: dateFrom, to: dateTo } }
      setFilters(newFilters)
      onFiltersChange?.(newFilters)
      setShowDatePicker(false)
    }
  }

  const handleClearFilters = () => {
    const newFilters: FilterState = {
      statuses: [],
    }
    setFilters(newFilters)
    setDateFrom(undefined)
    setDateTo(undefined)
    onFiltersChange?.(newFilters)
  }

  return (
    <Card className="p-6">
      <div className="space-y-6">
        <div className="grid grid-cols-3 gap-6">
          {/* Status Multi-select */}
          <fieldset className="border-0 p-0 m-0 min-w-0">
            <legend className="text-sm font-medium text-foreground">Status</legend>
            <div className="mt-2 space-y-2">
              {statusOptions.map((status) => (
                <label key={status} className="flex items-center gap-2 cursor-pointer">
                  <input
                    id={`status-${status}`}
                    type="checkbox"
                    checked={filters.statuses.includes(status)}
                    onChange={() => handleStatusToggle(status)}
                    className="h-4 w-4 rounded border-border"
                  />
                  <span className="text-sm text-muted-foreground capitalize">
                    {status.replace('_', ' ')}
                  </span>
                </label>
              ))}
            </div>
          </fieldset>

          {/* Institution Search */}
          <div>
            <label
              htmlFor="institution-search"
              className="text-sm font-medium text-foreground"
            >
              Institution
            </label>

            <Input
              id="institution-search"
              className="mt-2"
              placeholder="Search institution..."
              value={filters.institution ?? ""}
              onChange={(e) => {
                const value = e.target.value.trim()

                const newFilters = {
                  ...filters,
                  institution: value || undefined,
                }

                setFilters(newFilters)
                onFiltersChange?.(newFilters)
              }}
            />
          </div>

          {/* Date Range Picker */}
          <div>
            <span id="deadline-range-label" className="text-sm font-medium text-foreground">
              Deadline Range
            </span>
            <div className="mt-2">
              <Popover open={showDatePicker} onOpenChange={setShowDatePicker}>
                <PopoverTrigger
                  aria-labelledby="deadline-range-label"
                  className="flex w-full items-center rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                >
                  {filters.dateRange ? (
                    <span>
                      {filters.dateRange.from.toLocaleDateString()} -{' '}
                      {filters.dateRange.to.toLocaleDateString()}
                    </span>
                  ) : (
                    <span>Pick dates</span>
                  )}
                </PopoverTrigger>
                <PopoverContent className="w-80" align="end">
                  <div className="space-y-4">
                    <div>
                      <p className="text-sm font-medium text-foreground mb-2">From:</p>
                      <Calendar mode="single" selected={dateFrom} onSelect={setDateFrom} />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground mb-2">To:</p>
                      <Calendar mode="single" selected={dateTo} onSelect={setDateTo} />
                    </div>
                    <Button onClick={handleDateRangeSet} className="w-full">
                      Apply Range
                    </Button>
                  </div>
                </PopoverContent>
              </Popover>
            </div>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex justify-between border-t border-border pt-4">
          <Button onClick={handleClearFilters} variant="outline">
            Clear All
          </Button>
          <div className="text-xs text-muted-foreground">
            {filters.statuses.length} status filters active
          </div>
        </div>
      </div>
    </Card>
  )
}
