'use client'

import { ArrowLeft, Building2, Calendar } from 'lucide-react'
import Link from 'next/link'
import { use, useEffect, useState } from 'react'
import { AppLayout } from '@/components/app-layout'
import { DataBlock } from '@/components/data-block'
import { ProposalEditor } from '@/components/proposal-editor'
import { StatusBadge } from '@/components/status-badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { UrgentIndicator } from '@/components/urgent-indicator'
import { getTenderById } from '@/lib/api'
import { getTenderDisplayName, type Tender } from '@/lib/types'

interface TenderDetailPageProps {
  params: Promise<{ id: string }>
}

export default function TenderDetailPage({ params }: TenderDetailPageProps) {
  const { id } = use(params)

  const [tender, setTender] = useState<Tender | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    async function loadTender() {
      setIsLoading(true)
      setError(null)
      try {
        const data = await getTenderById(parseInt(id))
        if (!cancelled) setTender(data)
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Failed to load tender')
      } finally {
        if (!cancelled) setIsLoading(false)
      }
    }

    loadTender()

    return () => {
      cancelled = true
    }
  }, [id])

  if (isLoading) {
    return (
      <AppLayout>
        <div className="flex h-full items-center justify-center p-8">
          <p className="text-muted-foreground">Loading tender…</p>
        </div>
      </AppLayout>
    )
  }

  if (error) {
    return (
      <AppLayout>
        <div className="flex h-full items-center justify-center p-8">
          <Card className="p-8 text-center">
            <h2 className="text-lg font-semibold text-foreground">Failed to load tender</h2>
            <p className="mt-2 text-muted-foreground">{error}</p>
            <Link href="/">
              <Button className="mt-4">Return to Dashboard</Button>
            </Link>
          </Card>
        </div>
      </AppLayout>
    )
  }

  if (!tender) {
    return (
      <AppLayout>
        <div className="flex h-full items-center justify-center p-8">
          <Card className="p-8 text-center">
            <h2 className="text-lg font-semibold text-foreground">Tender not found</h2>
            <p className="mt-2 text-muted-foreground">The tender you&apos;re looking for doesn&apos;t exist.</p>
            <Link href="/">
              <Button className="mt-4">Return to Dashboard</Button>
            </Link>
          </Card>
        </div>
      </AppLayout>
    )
  }

  const displayName = getTenderDisplayName(tender)

  return (
    <AppLayout>
      <div className="space-y-8 p-8">
        {/* Back button and header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/">
              <Button variant="ghost" size="sm" className="gap-2">
                <ArrowLeft className="h-4 w-4" />
                Back
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-foreground">{displayName}</h1>
              <p className="text-sm text-muted-foreground mt-1">{tender.bidNum}</p>
            </div>
          </div>
          <StatusBadge status={tender.status} />
        </div>

        {/* Overview Cards */}
        <div className="grid grid-cols-3 gap-4">
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <Building2 className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">Institution</p>
                <p className="font-medium text-foreground">{tender.institution || '—'}</p>
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center gap-3">
              <Calendar className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">Published</p>
                <p className="font-medium text-foreground">
                  {tender.datePublished ? new Date(tender.datePublished).toLocaleDateString() : '—'}
                </p>
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center gap-3">
              <Calendar className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">Deadline</p>
                <p className="font-medium text-foreground">
                  {tender.finalSubmissionDate ? new Date(tender.finalSubmissionDate).toLocaleDateString() : '—'}
                </p>
              </div>
            </div>
          </Card>
        </div>

        {/* Urgent indicator */}
        {tender.finalSubmissionDate && <UrgentIndicator deadline={new Date(tender.finalSubmissionDate)} />}

        {/* Main content tabs */}
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="ai-summary">AI Summary</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            {tender.generalInfo && (
              <Card className="p-6">
                <DataBlock data={tender.generalInfo} title="General Information" />
              </Card>
            )}

            {tender.lotsInfo && (
              <Card className="p-6">
                <DataBlock data={tender.lotsInfo} title="Lots Information" />
              </Card>
            )}

            {tender.scrapedData && (
              <Card className="p-6">
                <details className="cursor-pointer">
                  <summary className="font-semibold text-foreground hover:text-primary">
                    Raw Scraped Data
                  </summary>
                  <div className="mt-4">
                    <DataBlock data={tender.scrapedData} />
                  </div>
                </details>
              </Card>
            )}
          </TabsContent>

          {/* AI Summary Tab */}
          <TabsContent value="ai-summary" className="space-y-6">
            {tender.llmSummary && (
              <Card className="p-6">
                <h2 className="text-lg font-semibold text-foreground mb-4">AI Summary</h2>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                  {tender.llmSummary}
                </p>
              </Card>
            )}

            {tender.llmMergedObject && (
              <Card className="p-6">
                <DataBlock data={tender.llmMergedObject} title="AI-Enriched Data" />
              </Card>
            )}

            {/* Proposal Card */}
            <Card className="p-6">
              {tender.proposalAiGenerated ? (
                <ProposalEditor tender={tender} />
              ) : (
                <p className="text-sm text-muted-foreground">No proposal generated yet.</p>
              )}
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  )
}
