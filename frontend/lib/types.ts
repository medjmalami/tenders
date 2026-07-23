// Tender types
export type TenderStatus = 'open' | 'closing_soon' | 'closed' | 'awarded'
export type TenderCategory = 'construction' | 'technology' | 'services' | 'supplies' | 'other'
export type ProposalStatus = 'draft' | 'submitted' | 'under_review' | 'accepted' | 'rejected'

export interface Tender {
  id: string
  title: string
  description: string
  organization: string
  status: TenderStatus
  category: TenderCategory
  budget: number
  deadline: Date
  aiRankScore: number // 0-100
  aiSummary: string
  aiRecommendation: string
  submittedProposal?: Proposal
  createdAt: Date
  updatedAt: Date
}

export interface Proposal {
  id: string
  tenderId: string
  status: ProposalStatus
  content: string
  submittedAt?: Date
  reviewedAt?: Date
  reviewer?: string
  createdAt: Date
  updatedAt: Date
}

export interface PipelineRun {
  id: string
  runNumber: number
  status: 'running' | 'success' | 'failed' | 'completed'
  startedAt: Date
  completedAt?: Date
  tenderCount: number
  successCount: number
  errorCount: number
  logs: PipelineLog[]
}

export interface PipelineLog {
  id: string
  runId: string
  level: 'info' | 'warning' | 'error'
  message: string
  timestamp: Date
  details?: string
  tenderId?: string
}

export interface DashboardStats {
  totalTenders: number
  openTenders: number
  highScoreTenders: number
  submittedProposals: number
  averageScore: number
}
