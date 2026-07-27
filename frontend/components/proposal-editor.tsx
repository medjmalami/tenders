'use client'

import { Download, FileDown } from 'lucide-react'
import { useMemo, useState } from 'react'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import type { Tender } from '@/lib/types'

interface ProposalEditorProps {
  tender: Tender
}

export function ProposalEditor({ tender }: ProposalEditorProps) {
  const [finalContent, setFinalContent] = useState(tender.proposalFinal || tender.proposalAiGenerated || '')

  const proposalStatus = useMemo(() => {
    if (!tender.proposalAiGenerated && !tender.proposalFinal) return 'Not started'
    if (!tender.proposalFinal) return 'AI draft only'
    if (tender.proposalFinal === tender.proposalAiGenerated) return 'Matches AI draft'
    return 'Edited'
  }, [tender.proposalAiGenerated, tender.proposalFinal])

  const handleSave = () => {
    if (!finalContent.trim()) {
      toast.error('Proposal content cannot be empty')
      return
    }
    toast.success('Proposal saved successfully')
  }

  const handleExportPDF = () => {
    toast.info('PDF export feature coming soon')
  }

  const handleExportDOCX = () => {
    toast.info('DOCX export feature coming soon')
  }

  return (
    <div className="space-y-6">
      {/* Status Badge */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-foreground">Proposal</h2>
        <Badge variant="secondary">{proposalStatus}</Badge>
      </div>

      {/* AI Generated Draft (Read-only) */}
      {tender.proposalAiGenerated && (
        <Card className="border-l-4 border-l-blue-500 bg-blue-50 p-6 dark:bg-blue-950">
          <div className="space-y-4">
            <div>
              <h3 className="font-semibold text-foreground">AI-Generated Draft</h3>
              <p className="text-sm text-muted-foreground mt-1">Reference only - original AI draft</p>
            </div>
            <div className="rounded-lg bg-background p-4 text-sm text-muted-foreground whitespace-pre-wrap font-mono text-xs max-h-48 overflow-y-auto">
              {tender.proposalAiGenerated}
            </div>
          </div>
        </Card>
      )}

      {/* Final Proposal Editor */}
      <Card className="p-6">
        <div className="space-y-4">
          <div>
            <h3 className="font-semibold text-foreground">Final Proposal</h3>
            <p className="text-sm text-muted-foreground mt-1">
              {tender.proposalFinal ? 'Edit your proposal' : 'Create your proposal (or start from AI draft)'}
            </p>
          </div>

          <Textarea
            value={finalContent}
            onChange={(e) => setFinalContent(e.target.value)}
            placeholder="Enter your final proposal here..."
            className="min-h-96"
          />
        </div>
      </Card>

      {/* Actions */}
      <Card className="bg-blue-50 p-6 dark:bg-blue-950">
        <div className="space-y-4">
          <div>
            <h3 className="font-semibold text-foreground">Save & Export</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Save your work or export in different formats
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Button onClick={handleSave} className="gap-2 bg-green-600 hover:bg-green-700">
              Save Proposal
            </Button>

            <Button onClick={handleExportPDF} variant="outline" className="gap-2">
              <FileDown className="h-4 w-4" />
              Export as PDF
            </Button>

            <Button onClick={handleExportDOCX} variant="outline" className="gap-2">
              <Download className="h-4 w-4" />
              Export as DOCX
            </Button>
          </div>
        </div>
      </Card>

      {/* Word count */}
      <div className="text-xs text-muted-foreground">
        {finalContent.split(/\s+/).filter(Boolean).length} words
      </div>
    </div>
  )
}
