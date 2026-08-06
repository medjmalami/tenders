import type { TenderStatus, TenderSummary } from "./types";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export interface DashboardStatsResponse {
  totalTenders: number;
  acceptedTenders: number;
  dueWithin7Days: number;
  recentTenders: TenderSummary[];
}

export async function getDashboardStats(): Promise<DashboardStatsResponse> {
  const res = await fetch(`${API_URL}/stats`, { cache: "no-store" });
  if (!res.ok) throw new Error(`Failed to fetch stats: ${res.status}`);
  const data = await res.json();
  return {
    totalTenders: data.total_tenders,
    acceptedTenders: data.accepted_tenders,
    dueWithin7Days: data.due_within_7_days,
    recentTenders: data.recent_tenders,
  };
}

export interface GetTendersParams {
  offset?: number;
  limit?: number;
  statuses?: TenderStatus[];
  institution?: string;
  deadlineFrom?: string; // "YYYY-MM-DD"
  deadlineTo?: string;
}

export interface PaginatedTendersResponse {
  total: number;
  page: number;
  pageSize: number;
  tenders: TenderSummary[];
}

export async function getTenders(
  params: GetTendersParams = {}
): Promise<PaginatedTendersResponse> {
  const searchParams = new URLSearchParams();
  searchParams.set("limit", String(params.limit ?? 10));
  searchParams.set("offset", String(params.offset ?? 0));
  params.statuses?.forEach((s) => searchParams.append("statuses", s));
  if (params.institution) searchParams.set("institution", params.institution);
  if (params.deadlineFrom) searchParams.set("deadline_from", params.deadlineFrom);
  if (params.deadlineTo) searchParams.set("deadline_to", params.deadlineTo);

  const res = await fetch(`${API_URL}/tenders?${searchParams.toString()}`, {
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`Failed to fetch tenders: ${res.status}`);
  const data = await res.json();
  return {
    total: data.total,
    page: data.page,
    pageSize: data.page_size,
    tenders: data.tenders,
  };
}
