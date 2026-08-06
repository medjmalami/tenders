// Tender types
export type TenderStatus = 'accepted' | 'rejected' | 'needs_more_data'

export interface Tender {
  id: number
  batchId: number
  bidNum: string
  bidMasterNum: string | null
  bidNameAr: string | null
  bidNameFr: string | null
  bidNameEn: string | null
  scrapedData: Record<string, any> // raw scraped JSON, unstructured
  status: TenderStatus
  datePublished: string | null // date
  finalSubmissionDate: string | null // date — deadline
  institution: string | null
  generalInfo: Record<string, any> | null // unstructured JSONB
  lotsInfo: Record<string, any> | null // unstructured JSONB
  llmMergedObject: Record<string, any> | null // unstructured JSONB — AI-enriched/merged data
  llmSummary: string | null // AI-generated prose summary
  proposalAiGenerated: string | null // AI-drafted proposal text
  proposalFinal?: string | null // human-edited/final proposal text
  createdAt: string
  updatedAt?: string | null
}
export interface TenderSummary {
  id: number
  name: string
  institution: string
  deadline: string | null
  status: TenderStatus
}
export interface Batch {
  id: number
  runNumber: number
  tendersFoundCount: number
  runDate: string
  targetDate: string
}

export interface DashboardStats {
  totalTenders: number
  needsMoreDataCount: number
  dueWithin7Days: number
  acceptedCount: number
}

export function getTenderDisplayName(tender: Tender): string {
  return tender.bidNameFr ?? tender.bidNameEn ?? tender.bidNameAr ?? tender.bidNum
}
