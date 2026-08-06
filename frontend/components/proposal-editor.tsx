'use client'

import { Download, FileDown } from 'lucide-react'
import { useMemo } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { markdownToDocxBlob } from '@/lib/markdown-to-docx'
import { getTenderDisplayName, type Tender } from '@/lib/types'

interface ProposalEditorProps {
  tender: Tender
}

export function ProposalEditor({ tender }: ProposalEditorProps) {
  const finalContent = tender.proposalFinal || tender.proposalAiGenerated || ''

  const proposalStatus = useMemo(() => {
    if (!tender.proposalAiGenerated && !tender.proposalFinal) return 'Not started'
    if (!tender.proposalFinal) return 'AI draft only'
    if (tender.proposalFinal === tender.proposalAiGenerated) return 'Matches AI draft'
    return 'Edited'
  }, [tender.proposalAiGenerated, tender.proposalFinal])

  const handleExportPDF = () => {
    toast.info('PDF export feature coming soon')
  }

  const handleExportDOCX = async () => {
    if (!finalContent.trim()) {
      toast.error('Nothing to export yet')
      return
    }
    try {
      const blob = await markdownToDocxBlob(finalContent, getTenderDisplayName(tender))
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${tender.bidNum || 'proposal'}.docx`
      document.body.appendChild(a)
      a.click()
      a.remove()
      URL.revokeObjectURL(url)
      toast.success('DOCX downloaded')
    } catch (err) {
      console.error(err)
      toast.error('Failed to generate DOCX')
    }
  }

  return (
    <div className="space-y-6">
      {/* Status Badge */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-foreground">Proposal</h2>
        <Badge variant="secondary">{proposalStatus}</Badge>
      </div>

      {/* Proposal Preview */}
      <Card className="border-l-4 border-l-blue-500 bg-blue-50 p-6 dark:bg-blue-950">
        <div className="space-y-4">
          <div>
            <p className="text-sm text-muted-foreground mt-1">
              Rendered preview of the proposal
            </p>
          </div>

          <div className="rounded-lg bg-background p-6 min-h-96">
            {finalContent.trim() ? (
              <div className="prose prose-sm dark:prose-invert max-w-none prose-headings:font-semibold prose-p:text-foreground prose-li:text-foreground prose-strong:text-foreground">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {finalContent}
                </ReactMarkdown>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                Nothing to preview yet.
              </p>
            )}
          </div>
        </div>
      </Card>

      {/* Export Actions */}
      <Card className="bg-blue-50 p-6 dark:bg-blue-950">
        <div className="space-y-4">
          <div>
            <h3 className="font-semibold text-foreground">Export</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Export the proposal in different formats
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
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
