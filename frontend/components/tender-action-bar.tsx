'use client'

import { CheckCircle2, HelpCircle, XCircle } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import type { Tender } from '@/lib/types'

interface TenderActionBarProps {
  tender: Tender
}

export function TenderActionBar({ tender }: TenderActionBarProps) {
  const handleAccept = () => {
    toast.success('Tender accepted for proposal submission')
  }

  const handleReject = () => {
    toast.info('Tender marked as rejected')
  }

  const handleNeedsMoreData = () => {
    toast.info('Tender marked as needing more data')
  }

  const getStatusColor = (): string => {
    switch (tender.status) {
      case 'accepted':
        return 'border-l-green-500 bg-green-50 dark:bg-green-950'
      case 'rejected':
        return 'border-l-red-500 bg-red-50 dark:bg-red-950'
      case 'needs_more_data':
        return 'border-l-amber-500 bg-amber-50 dark:bg-amber-950'
      default:
        return 'border-l-blue-500 bg-blue-50 dark:bg-blue-950'
    }
  }

  return (
    <Card className={`border-l-4 p-6 ${getStatusColor()}`}>
      <div className="space-y-4">
        <div>
          <h3 className="font-semibold text-foreground">Decision</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Current status: <span className="capitalize">{tender.status.replace('_', ' ')}</span>
          </p>
        </div>

        <div className="flex gap-3">
          <Button
            onClick={handleAccept}
            className="gap-2 bg-green-600 hover:bg-green-700"
          >
            <CheckCircle2 className="h-4 w-4" />
            Accept
          </Button>

          <Button
            onClick={handleReject}
            className="gap-2 bg-red-600 hover:bg-red-700"
          >
            <XCircle className="h-4 w-4" />
            Reject
          </Button>

          <Button
            onClick={handleNeedsMoreData}
            className="gap-2 bg-amber-600 hover:bg-amber-700"
          >
            <HelpCircle className="h-4 w-4" />
            Needs More Data
          </Button>
        </div>
      </div>
    </Card>
  )
}
