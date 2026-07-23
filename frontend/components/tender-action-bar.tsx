'use client'

import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { CheckCircle2, XCircle, Flag } from 'lucide-react'
import { toast } from 'sonner'

export function TenderActionBar() {
  const handleAccept = () => {
    toast.success('Tender accepted for proposal submission')
  }

  const handleReject = () => {
    toast.info('Tender marked as rejected')
  }

  const handleFlag = () => {
    toast.info('Tender flagged for review by team')
  }

  return (
    <Card className="border-l-4 border-l-blue-500 bg-blue-50 p-6 dark:bg-blue-950">
      <div className="space-y-4">
        <div>
          <h3 className="font-semibold text-foreground">Action Required</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Decide whether to pursue this opportunity
          </p>
        </div>

        <div className="flex gap-3">
          <Button
            onClick={handleAccept}
            className="gap-2 bg-green-600 hover:bg-green-700"
          >
            <CheckCircle2 className="h-4 w-4" />
            Accept & Propose
          </Button>

          <Button
            onClick={handleReject}
            variant="outline"
            className="gap-2"
          >
            <XCircle className="h-4 w-4" />
            Reject
          </Button>

          <Button
            onClick={handleFlag}
            variant="outline"
            className="gap-2"
          >
            <Flag className="h-4 w-4" />
            Flag for Review
          </Button>
        </div>
      </div>
    </Card>
  )
}
