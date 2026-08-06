'use client'

import { useEffect, useState } from 'react'
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

interface LatestBatch {
  run_number: number
  run_date: string
  tenders_found_count: number
}

interface BatchListItem {
  id: number
  run_number: number
  tenders_found_count: number
  run_date: string
  target_date: string
}

interface BatchesPageResponse {
  latest: LatestBatch | null
  batches: BatchListItem[]
  page: number
  limit: number
}

export function BatchHistory() {
  const [data, setData] = useState<BatchesPageResponse | null>(null)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const controller = new AbortController()

    async function fetchBatches() {
      setLoading(true)
      setError(null)
      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/pipelines?page=${page}`,
          { signal: controller.signal }
        )
        if (!res.ok) throw new Error(`Request failed: ${res.status}`)
        const json: BatchesPageResponse = await res.json()
        setData(json)
      } catch (err) {
        if (err instanceof Error && err.name !== 'AbortError') {
          setError(err.message)
        }
      } finally {
        setLoading(false)
      }
    }

    fetchBatches()
    return () => controller.abort()
  }, [page])

  if (loading && !data) {
    return <p className="text-sm text-muted-foreground">Loading batch history...</p>
  }

  if (error) {
    return <p className="text-sm text-destructive">Failed to load batches: {error}</p>
  }

  if (!data) return null

  const { latest, batches, limit } = data
  const hasNextPage = batches.length === limit

  return (
    <div className="space-y-6">
      {/* Latest Batch Summary */}
      {latest && (
        <Card className="p-6 bg-blue-50 dark:bg-blue-950">
          <div className="grid grid-cols-3 gap-6">
            <div>
              <p className="text-xs text-muted-foreground">Latest Run #</p>
              <p className="mt-2 text-3xl font-bold text-foreground">{latest.run_number}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Run Date</p>
              <p className="mt-2 text-lg font-semibold text-foreground">
                {new Date(latest.run_date).toLocaleDateString()}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Tenders Found</p>
              <p className="mt-2 text-3xl font-bold text-foreground">{latest.tenders_found_count}</p>
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
                <TableCell className="font-medium text-foreground">{batch.run_number}</TableCell>
                <TableCell>{new Date(batch.run_date).toLocaleDateString()}</TableCell>
                <TableCell>{new Date(batch.target_date).toLocaleDateString()}</TableCell>
                <TableCell className="text-sm text-muted-foreground">{batch.tenders_found_count}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      {/* Pagination */}
      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setPage((p) => Math.max(1, p - 1))}
          disabled={page === 1 || loading}
        >
          Previous
        </Button>
        <span className="text-sm text-muted-foreground">Page {page}</span>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setPage((p) => p + 1)}
          disabled={!hasNextPage || loading}
        >
          Next
        </Button>
      </div>
    </div>
  )
}
