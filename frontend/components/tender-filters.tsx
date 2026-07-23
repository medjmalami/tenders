'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Slider } from '@/components/ui/slider'
import { Card } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Calendar } from '@/components/ui/calendar'
import { X } from 'lucide-react'
import type { TenderCategory, TenderStatus } from '@/lib/types'

interface TenderFiltersProps {
  onFiltersChange?: (filters: FilterState) => void
}

export interface FilterState {
  statuses: TenderStatus[]
  category?: TenderCategory
  scoreMin: number
  dateRange?: { from: Date; to: Date }
}

const statusOptions: TenderStatus[] = ['open', 'closing_soon', 'closed', 'awarded']
const categoryOptions: TenderCategory[] = ['construction', 'technology', 'services', 'supplies', 'other']

export function TenderFilters({ onFiltersChange }: TenderFiltersProps) {
  const [filters, setFilters] = useState<FilterState>({
    statuses: ['open', 'closing_soon'],
    scoreMin: 0,
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

  const handleCategoryChange = (category: string) => {
    const newFilters = {
      ...filters,
      category: category === 'all' ? undefined : (category as TenderCategory),
    }
    setFilters(newFilters)
    onFiltersChange?.(newFilters)
  }

  const handleScoreChange = (value: number[]) => {
    const newFilters = { ...filters, scoreMin: value[0] }
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
      statuses: ['open', 'closing_soon'],
      scoreMin: 0,
    }
    setFilters(newFilters)
    setDateFrom(undefined)
    setDateTo(undefined)
    onFiltersChange?.(newFilters)
  }

  return (
    <Card className="p-6">
      <div className="space-y-6">
        <div className="grid grid-cols-4 gap-6">
          {/* Status Multi-select */}
          <div>
            <label className="text-sm font-medium text-foreground">Status</label>
            <div className="mt-2 space-y-2">
              {statusOptions.map((status) => (
                <label key={status} className="flex items-center gap-2 cursor-pointer">
                  <input
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
          </div>

          {/* Category Select */}
          <div>
            <label className="text-sm font-medium text-foreground">Category</label>
            <Select defaultValue="all" onValueChange={handleCategoryChange}>
              <SelectTrigger className="mt-2">
                <SelectValue placeholder="All categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categoryOptions.map((cat) => (
                  <SelectItem key={cat} value={cat}>
                    {cat.charAt(0).toUpperCase() + cat.slice(1)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Score Slider */}
          <div>
            <label className="text-sm font-medium text-foreground">Min AI Score</label>
            <div className="mt-4">
              <Slider
                min={0}
                max={100}
                step={5}
                value={[filters.scoreMin]}
                onValueChange={handleScoreChange}
                className="w-full"
              />
              <div className="mt-2 text-sm text-muted-foreground">{filters.scoreMin}+</div>
            </div>
          </div>

          {/* Date Range Picker */}
          <div>
            <label className="text-sm font-medium text-foreground">Deadline Range</label>
            <div className="mt-2">
              <Popover open={showDatePicker} onOpenChange={setShowDatePicker}>
                <PopoverTrigger className="flex w-full items-center rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
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
