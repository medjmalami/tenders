'use client'

import { use } from 'react'
import Link from 'next/link'
import { AppLayout } from '@/components/app-layout'
import { TenderActionBar } from '@/components/tender-action-bar'
import { TenderAIAnalysis } from '@/components/tender-ai-analysis'
import { StatusBadge } from '@/components/status-badge'
import { UrgentIndicator } from '@/components/urgent-indicator'
import { Card } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { getTenderById } from '@/lib/mock-data'
import { ArrowLeft, Calendar, DollarSign, Building2, FileText } from 'lucide-react'

interface TenderDetailPageProps {
  params: Promise<{ id: string }>
}

export default function TenderDetailPage({ params }: TenderDetailPageProps) {
  const { id } = use(params)
  const tender = getTenderById(id)

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
              <h1 className="text-2xl font-bold text-foreground">{tender.title}</h1>
              <p className="text-sm text-muted-foreground mt-1">{tender.id}</p>
            </div>
          </div>
          <StatusBadge status={tender.status} />
        </div>

        {/* Overview Cards */}
        <div className="grid grid-cols-4 gap-4">
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <Building2 className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">Organization</p>
                <p className="font-medium text-foreground">{tender.organization}</p>
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center gap-3">
              <DollarSign className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">Budget</p>
                <p className="font-medium text-foreground">
                  ${(tender.budget / 1000).toFixed(0)}k
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
                  {tender.deadline.toLocaleDateString()}
                </p>
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center gap-3">
              <FileText className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">Category</p>
                <p className="font-medium text-foreground capitalize">
                  {tender.category}
                </p>
              </div>
            </div>
          </Card>
        </div>

        {/* Urgent indicator */}
        <UrgentIndicator deadline={tender.deadline} />

        {/* Main content tabs */}
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="analysis">AI Analysis</TabsTrigger>
            <TabsTrigger value="proposal">Proposal</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <Card className="p-6">
              <h2 className="text-lg font-semibold text-foreground">Description</h2>
              <p className="mt-4 whitespace-pre-wrap text-sm text-muted-foreground">
                {tender.description}
              </p>
            </Card>

            {/* Action Bar */}
            <TenderActionBar />
          </TabsContent>

          {/* Analysis Tab */}
          <TabsContent value="analysis">
            <TenderAIAnalysis tender={tender} />
          </TabsContent>

          {/* Proposal Tab */}
          <TabsContent value="proposal">
            <Card className="p-6">
              {tender.submittedProposal ? (
                <div className="space-y-4">
                  <div>
                    <h2 className="text-lg font-semibold text-foreground">
                      Submitted Proposal
                    </h2>
                    <p className="text-xs text-muted-foreground mt-1">
                      Submitted on {tender.submittedProposal.submittedAt?.toLocaleDateString()}
                    </p>
                  </div>
                  <div className="rounded-lg bg-muted/50 p-4">
                    <p className="whitespace-pre-wrap text-sm text-muted-foreground">
                      {tender.submittedProposal.content}
                    </p>
                  </div>
                  <Link href={`/proposals/${tender.submittedProposal.id}`}>
                    <Button>Edit Proposal</Button>
                  </Link>
                </div>
              ) : (
                <div className="py-8 text-center">
                  <p className="text-muted-foreground">No proposal submitted yet</p>
                  <Link href={`/proposals/new?tenderId=${tender.id}`}>
                    <Button className="mt-4">Create Proposal</Button>
                  </Link>
                </div>
              )}
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  )
}
