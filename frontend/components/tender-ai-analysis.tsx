import { Card } from '@/components/ui/card'
import { RankBadge } from './rank-badge'
import { AlertCircle, TrendingUp } from 'lucide-react'
import type { Tender } from '@/lib/types'

interface TenderAIAnalysisProps {
  tender: Tender
}

export function TenderAIAnalysis({ tender }: TenderAIAnalysisProps) {
  const isHighScore = tender.aiRankScore >= 75
  const isMediumScore = tender.aiRankScore >= 60 && tender.aiRankScore < 75
  const isLowScore = tender.aiRankScore < 60

  return (
    <div className="space-y-6">
      {/* Overall Score Card */}
      <Card className="p-6">
        <div className="flex items-center gap-8">
          <div>
            <h3 className="font-semibold text-foreground">AI Fit Score</h3>
            <p className="text-sm text-muted-foreground">
              Based on historical performance and company capabilities
            </p>
          </div>

          <div className="flex flex-col items-center gap-2">
            <RankBadge score={tender.aiRankScore} />
            <div className="text-xs text-muted-foreground">
              {isHighScore && 'Excellent fit'}
              {isMediumScore && 'Good fit'}
              {isLowScore && 'Questionable fit'}
            </div>
          </div>
        </div>
      </Card>

      {/* Recommendation */}
      <Card className="border-l-4 border-l-amber-500 p-6">
        <div className="flex gap-4">
          <TrendingUp className="h-5 w-5 flex-shrink-0 text-amber-600" />
          <div>
            <h3 className="font-semibold text-foreground">AI Recommendation</h3>
            <p className="mt-2 text-sm text-muted-foreground">{tender.aiRecommendation}</p>
          </div>
        </div>
      </Card>

      {/* Summary */}
      <Card className="p-6">
        <div className="space-y-4">
          <h3 className="font-semibold text-foreground">AI Summary</h3>
          <p className="whitespace-pre-wrap text-sm text-muted-foreground">
            {tender.aiSummary}
          </p>
        </div>
      </Card>

      {/* Key Factors */}
      <Card className="p-6">
        <div className="space-y-4">
          <h3 className="font-semibold text-foreground">Key Analysis Factors</h3>
          <div className="space-y-3">
            <div className="flex items-start gap-3 rounded-lg bg-muted/50 p-3">
              <div className="mt-0.5 h-2 w-2 flex-shrink-0 rounded-full bg-blue-500" />
              <div>
                <p className="text-sm font-medium text-foreground">Budget Alignment</p>
                <p className="text-xs text-muted-foreground">
                  Project budget of ${(tender.budget / 1000).toFixed(0)}k within historical range
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 rounded-lg bg-muted/50 p-3">
              <div className="mt-0.5 h-2 w-2 flex-shrink-0 rounded-full bg-green-500" />
              <div>
                <p className="text-sm font-medium text-foreground">Category Experience</p>
                <p className="text-xs text-muted-foreground">
                  Strong portfolio in {tender.category} category with 10+ similar projects
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 rounded-lg bg-muted/50 p-3">
              <div className="mt-0.5 h-2 w-2 flex-shrink-0 rounded-full bg-amber-500" />
              <div>
                <p className="text-sm font-medium text-foreground">Timeline Feasibility</p>
                <p className="text-xs text-muted-foreground">
                  {tender.deadline.getTime() - new Date().getTime() > 14 * 24 * 60 * 60 * 1000
                    ? 'Adequate time to prepare competitive proposal'
                    : 'Tight timeline - immediate action needed'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </Card>
    </div>
  )
}
