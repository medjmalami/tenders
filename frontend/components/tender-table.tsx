'use client'

import Link from 'next/link'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { StatusBadge } from './status-badge'
import { RankBadge } from './rank-badge'
import { UrgentIndicator } from './urgent-indicator'
import { ChevronRight } from 'lucide-react'
import type { Tender } from '@/lib/types'

interface TenderTableProps {
  tenders: Tender[]
}

export function TenderTable({ tenders }: TenderTableProps) {
  return (
    <Card>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Tender</TableHead>
            <TableHead>Organization</TableHead>
            <TableHead>Category</TableHead>
            <TableHead>Budget</TableHead>
            <TableHead>Deadline</TableHead>
            <TableHead className="text-center">Score</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="w-12"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {tenders.map((tender) => (
            <TableRow key={tender.id} className="hover:bg-muted/50">
              <TableCell>
                <div className="font-medium text-foreground">{tender.title}</div>
                <div className="text-xs text-muted-foreground">{tender.id}</div>
              </TableCell>
              <TableCell className="text-sm text-muted-foreground">{tender.organization}</TableCell>
              <TableCell>
                <span className="inline-block rounded-full bg-muted px-2 py-1 text-xs capitalize text-muted-foreground">
                  {tender.category}
                </span>
              </TableCell>
              <TableCell className="font-medium text-foreground">
                ${(tender.budget / 1000).toFixed(0)}k
              </TableCell>
              <TableCell>
                <div className="space-y-1">
                  <div className="text-sm text-foreground">
                    {tender.deadline.toLocaleDateString()}
                  </div>
                  <UrgentIndicator deadline={tender.deadline} />
                </div>
              </TableCell>
              <TableCell className="text-center">
                <RankBadge score={tender.aiRankScore} />
              </TableCell>
              <TableCell>
                <StatusBadge status={tender.status} />
              </TableCell>
              <TableCell>
                <Link href={`/tenders/${tender.id}`} passHref>
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </Link>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Card>
  )
}
