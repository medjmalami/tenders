'use client'

import { ChevronRight } from 'lucide-react'
import Link from 'next/link'
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
import type { Tender } from '@/lib/types'
import { getTenderDisplayName as getDisplayName } from '@/lib/types'
import { StatusBadge } from './status-badge'
import { UrgentIndicator } from './urgent-indicator'

interface TenderTableProps {
  tenders: Tender[]
}

export function TenderTable({ tenders }: TenderTableProps) {
  return (
    <Card>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Tender Name</TableHead>
            <TableHead>Institution</TableHead>
            <TableHead>Deadline</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="w-12"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {tenders.map((tender) => (
            <TableRow key={tender.id} className="hover:bg-muted/50">
              <TableCell>
                <div className="font-medium text-foreground">{getDisplayName(tender)}</div>
                <div className="text-xs text-muted-foreground">{tender.bidNum}</div>
              </TableCell>
              <TableCell className="text-sm text-muted-foreground">{tender.institution}</TableCell>
              <TableCell>
                <div className="space-y-1">
                  <div className="text-sm text-foreground">
                    {tender.finalSubmissionDate ? new Date(tender.finalSubmissionDate).toLocaleDateString() : '—'}
                  </div>
                  {tender.finalSubmissionDate && <UrgentIndicator deadline={new Date(tender.finalSubmissionDate)} />}
                </div>
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
