'use client'

import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { use } from 'react'
import { AppLayout } from '@/components/app-layout'
import { ProposalEditor } from '@/components/proposal-editor'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { getTenderById } from '@/lib/mock-data'
import { getTenderDisplayName } from '@/lib/types'

interface ProposalPageProps {
  params: Promise<{ id: string }>
}

export default function ProposalPage({ params }: ProposalPageProps) {
  const { id } = use(params)
  const tender = getTenderById(parseInt(id))

  if (!tender) {
    return (
      <AppLayout>
        <div className="flex h-full items-center justify-center">
          <Card className="p-8 text-center">
            <h2 className="text-lg font-semibold text-foreground">Tender not found</h2>
            <Link href="/">
              <Button className="mt-4">Return to Dashboard</Button>
            </Link>
          </Card>
        </div>
      </AppLayout>
    )
  }

  return (
    <AppLayout>
      <div className="space-y-8 p-8">
        {/* Back button and header */}
        <div className="flex items-center gap-4">
          <Link href={`/tenders/${tender.id}`}>
            <Button variant="ghost" size="sm" className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Proposal</h1>
            <p className="text-sm text-muted-foreground mt-1">
              {getTenderDisplayName(tender)}
            </p>
          </div>
        </div>

        {/* Proposal Editor */}
        <ProposalEditor tender={tender} />
      </div>
    </AppLayout>
  )
}
