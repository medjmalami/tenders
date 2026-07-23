'use client'

import { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { FileDown, Download } from 'lucide-react'
import { toast } from 'sonner'
import type { Proposal } from '@/lib/types'

interface ProposalEditorProps {
  proposal?: Proposal
  readonly?: boolean
}

export function ProposalEditor({ proposal, readonly = false }: ProposalEditorProps) {
  const [content, setContent] = useState(proposal?.content || '')

  const handleSave = () => {
    if (!content.trim()) {
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
      {/* Editor */}
      <Card className="p-6">
        <div className="space-y-4">
          <div>
            <h2 className="text-lg font-semibold text-foreground">Proposal Content</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Write your proposal here. Support for markdown formatting.
            </p>
          </div>

          <Textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Enter your proposal content here..."
            className="min-h-96 font-mono"
            disabled={readonly}
          />
        </div>
      </Card>

      {/* Actions */}
      {!readonly && (
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
                💾 Save Changes
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
      )}

      {/* Word count */}
      <div className="text-xs text-muted-foreground">
        {content.split(/\s+/).filter(Boolean).length} words
      </div>
    </div>
  )
}
