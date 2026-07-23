import {
  Tender,
  Proposal,
  PipelineRun,
  DashboardStats,
  TenderStatus,
  TenderCategory,
  ProposalStatus,
  PipelineLog,
} from './types'

// Helper to generate random dates
function getRandomDate(daysOffset: number) {
  const date = new Date()
  date.setDate(date.getDate() + daysOffset)
  return date
}

// Mock tender data
export const mockTenders: Tender[] = [
  {
    id: 'tender-001',
    title: 'City Hall HVAC System Upgrade',
    description:
      'Full replacement of HVAC systems in municipal building including ductwork, units, and controls.',
    organization: 'City of Springfield',
    status: 'closing_soon',
    category: 'construction',
    budget: 250000,
    deadline: getRandomDate(2),
    aiRankScore: 87,
    aiSummary: 'Strong fit - our experience with municipal HVAC projects is excellent.',
    aiRecommendation: 'RECOMMEND - High margin potential, familiar scope, established client.',
    submittedProposal: {
      id: 'prop-001',
      tenderId: 'tender-001',
      status: 'submitted',
      content: 'We propose a phased approach...',
      submittedAt: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    createdAt: new Date('2025-01-10'),
    updatedAt: new Date('2025-01-15'),
  },
  {
    id: 'tender-002',
    title: 'County Data Center Network Infrastructure',
    description: 'Supply and installation of enterprise networking equipment and fiber backbone.',
    organization: 'County IT Department',
    status: 'open',
    category: 'technology',
    budget: 450000,
    deadline: getRandomDate(10),
    aiRankScore: 72,
    aiSummary: 'Moderate fit - requires certified specialists on fiber optics installation.',
    aiRecommendation: 'CONSIDER - Solid opportunity but tight timeline for this scope.',
    createdAt: new Date('2025-01-12'),
    updatedAt: new Date('2025-01-15'),
  },
  {
    id: 'tender-003',
    title: 'School Supplies Contract',
    description: 'Annual office and classroom supplies including furniture, stationery, and tech items.',
    organization: 'School District 7',
    status: 'open',
    category: 'supplies',
    budget: 85000,
    deadline: getRandomDate(20),
    aiRankScore: 54,
    aiSummary: 'Lower margin commodity supply - competitive pricing essential.',
    aiRecommendation: 'PASS - Margin too thin, high competition.',
    createdAt: new Date('2025-01-08'),
    updatedAt: new Date('2025-01-15'),
  },
  {
    id: 'tender-004',
    title: 'Community Health Facility Renovation',
    description: 'Complete interior renovation including medical spaces, waiting areas, and administrative offices.',
    organization: 'Health Services Agency',
    status: 'open',
    category: 'construction',
    budget: 320000,
    deadline: getRandomDate(18),
    aiRankScore: 91,
    aiSummary: 'Excellent fit - portfolio matches perfectly, team has completed similar projects.',
    aiRecommendation: 'HIGHLY RECOMMEND - Top priority for pursuit.',
    createdAt: new Date('2025-01-11'),
    updatedAt: new Date('2025-01-15'),
  },
  {
    id: 'tender-005',
    title: 'IT Managed Services Contract',
    description: 'Managed IT services including help desk, security monitoring, infrastructure management.',
    organization: 'County Government',
    status: 'closing_soon',
    category: 'services',
    budget: 200000,
    deadline: getRandomDate(1),
    aiRankScore: 78,
    aiSummary: 'Good opportunity - our MSP capabilities align well.',
    aiRecommendation: 'RECOMMEND - Urgent deadline, prepare submission immediately.',
    createdAt: new Date('2025-01-13'),
    updatedAt: new Date('2025-01-15'),
  },
  {
    id: 'tender-006',
    title: 'Traffic Signal System Replacement',
    description: 'Installation of modern adaptive traffic signal system across downtown district.',
    organization: 'Department of Transportation',
    status: 'open',
    category: 'technology',
    budget: 680000,
    deadline: getRandomDate(25),
    aiRankScore: 65,
    aiSummary: 'Specialized equipment and regulatory compliance required - niche expertise needed.',
    aiRecommendation: 'CONSIDER - Reach out to potential subcontractors for capability assessment.',
    createdAt: new Date('2025-01-09'),
    updatedAt: new Date('2025-01-15'),
  },
]

// Mock proposals
export const mockProposals: Proposal[] = [
  {
    id: 'prop-001',
    tenderId: 'tender-001',
    status: 'submitted',
    content: `Our company brings 15 years of experience in commercial HVAC systems.

## Proposed Approach
- Full system assessment (Week 1)
- Equipment procurement (Weeks 2-3)
- Installation phase (Weeks 4-8)
- Testing and commissioning (Week 9)

## Team
- Project Manager: John Smith (HVAC certified)
- Lead Technician: Sarah Johnson (20+ years experience)
- 2 additional certified technicians

## Timeline: 10 weeks
## Cost: $235,000`,
    submittedAt: new Date('2025-01-15'),
    createdAt: new Date('2025-01-14'),
    updatedAt: new Date('2025-01-15'),
  },
]

// Mock pipeline runs
export const mockPipelineRuns: PipelineRun[] = [
  {
    id: 'run-001',
    runNumber: 42,
    status: 'completed',
    startedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    completedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000 + 45 * 60 * 1000),
    tenderCount: 12,
    successCount: 11,
    errorCount: 1,
    logs: [
      {
        id: 'log-001',
        runId: 'run-001',
        level: 'info',
        message: 'Pipeline started',
        timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      },
      {
        id: 'log-002',
        runId: 'run-001',
        level: 'info',
        message: 'Fetching tender data from government sources...',
        timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000 + 2 * 60 * 1000),
      },
      {
        id: 'log-003',
        runId: 'run-001',
        level: 'info',
        message: 'Processing 12 tenders',
        timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000 + 5 * 60 * 1000),
      },
      {
        id: 'log-004',
        runId: 'run-001',
        level: 'error',
        message: 'Failed to parse tender #8: Invalid document format',
        timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000 + 15 * 60 * 1000),
        details: 'PDF parser failed: Expected text content, got binary stream',
        tenderId: 'tender-008',
      },
      {
        id: 'log-005',
        runId: 'run-001',
        level: 'info',
        message: 'Running AI analysis on 11 tenders',
        timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000 + 20 * 60 * 1000),
      },
      {
        id: 'log-006',
        runId: 'run-001',
        level: 'info',
        message: 'Pipeline completed successfully',
        timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000 + 45 * 60 * 1000),
      },
    ],
  },
  {
    id: 'run-002',
    runNumber: 41,
    status: 'completed',
    startedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
    completedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000 + 50 * 60 * 1000),
    tenderCount: 9,
    successCount: 9,
    errorCount: 0,
    logs: [
      {
        id: 'log-101',
        runId: 'run-002',
        level: 'info',
        message: 'Pipeline started',
        timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
      },
      {
        id: 'log-102',
        runId: 'run-002',
        level: 'info',
        message: 'Fetching tender data from government sources...',
        timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000 + 2 * 60 * 1000),
      },
      {
        id: 'log-103',
        runId: 'run-002',
        level: 'info',
        message: 'Processing 9 tenders',
        timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000 + 5 * 60 * 1000),
      },
      {
        id: 'log-104',
        runId: 'run-002',
        level: 'info',
        message: 'Running AI analysis on 9 tenders',
        timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000 + 15 * 60 * 1000),
      },
      {
        id: 'log-105',
        runId: 'run-002',
        level: 'info',
        message: 'Pipeline completed successfully',
        timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000 + 50 * 60 * 1000),
      },
    ],
  },
]

// Get functions for components
export function getDashboardStats(): DashboardStats {
  const openTenders = mockTenders.filter((t) => t.status === 'open' || t.status === 'closing_soon')
  const highScore = mockTenders.filter((t) => t.aiRankScore >= 75)
  const submitted = mockProposals.filter((p) => p.status === 'submitted')
  const avgScore = mockTenders.reduce((sum, t) => sum + t.aiRankScore, 0) / mockTenders.length

  return {
    totalTenders: mockTenders.length,
    openTenders: openTenders.length,
    highScoreTenders: highScore.length,
    submittedProposals: submitted.length,
    averageScore: Math.round(avgScore),
  }
}

export function getTenders(): Tender[] {
  return mockTenders
}

export function getTenderById(id: string): Tender | undefined {
  return mockTenders.find((t) => t.id === id)
}

export function getProposalsByTenderId(tenderId: string): Proposal[] {
  return mockProposals.filter((p) => p.tenderId === tenderId)
}

export function getPipelineRuns(): PipelineRun[] {
  return mockPipelineRuns
}

export function getPipelineRunById(id: string): PipelineRun | undefined {
  return mockPipelineRuns.find((r) => r.id === id)
}
