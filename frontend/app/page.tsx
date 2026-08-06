"use client";
import { useEffect, useState } from "react";
import { AppLayout } from "@/components/app-layout";
import { DashboardStats } from "@/components/dashboard-stats";
import { type FilterState, TenderFilters } from "@/components/tender-filters";
import { TenderTable } from "@/components/tender-table";
import { getDashboardStats, getTenders } from "@/lib/api";
import type { TenderSummary } from "@/lib/types";

const PAGE_SIZE = 10;

function toDateParam(date: Date) {
  return date.toISOString().slice(0, 10);
}

export default function Dashboard() {
  const [filters, setFilters] = useState<FilterState>({ statuses: [] });
  const [currentPage, setCurrentPage] = useState(1);

  const [stats, setStats] = useState({
    totalTenders: 0,
    acceptedTenders: 0,
    dueWithin7Days: 0,
  });

  const [tenders, setTenders] = useState<TenderSummary[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getDashboardStats()
      .then((data) =>
        setStats({
          totalTenders: data.totalTenders,
          acceptedTenders: data.acceptedTenders,
          dueWithin7Days: data.dueWithin7Days,
        })
      )
      .catch((err) => console.error("Failed to load stats:", err));
  }, []);

  useEffect(() => {
    setIsLoading(true);
    setError(null);

    getTenders({
      offset: (currentPage - 1) * PAGE_SIZE,
      limit: PAGE_SIZE,
      statuses: filters.statuses.length > 0 ? filters.statuses : undefined,
      institution: filters.institution,
      deadlineFrom: filters.dateRange ? toDateParam(filters.dateRange.from) : undefined,
      deadlineTo: filters.dateRange ? toDateParam(filters.dateRange.to) : undefined,
    })
      .then((data) => {
        setTenders(data.tenders);
        setTotal(data.total);
      })
      .catch((err) => {
        console.error("Failed to load tenders:", err);
        setError("Failed to load tenders.");
      })
      .finally(() => setIsLoading(false));
  }, [filters, currentPage]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <AppLayout>
      <div className="space-y-8 p-8">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
          <p className="mt-2 text-muted-foreground">
            Overview of government tenders with AI-powered analysis
          </p>
        </div>

        <DashboardStats
          totalTenders={stats.totalTenders}
          acceptedCount={stats.acceptedTenders}
          dueWithin7Days={stats.dueWithin7Days}
        />

        <TenderFilters
          onFiltersChange={(newFilters) => {
            setFilters(newFilters);
            setCurrentPage(1);
          }}
        />

        <div>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-foreground">
              Tenders ({total})
            </h2>
          </div>

          {error ? (
            <div className="rounded-lg border border-border bg-card p-12 text-center">
              <p className="text-destructive">{error}</p>
            </div>
          ) : isLoading ? (
            <div className="rounded-lg border border-border bg-card p-12 text-center">
              <p className="text-muted-foreground">Loading tenders...</p>
            </div>
          ) : tenders.length > 0 ? (
            <>
              <TenderTable tenders={tenders} />
              <div className="mt-6 flex items-center justify-center gap-4">
                <button
                  className="rounded border px-3 py-1 disabled:opacity-50"
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage((p) => p - 1)}
                >
                  Previous
                </button>
                <span className="text-sm text-muted-foreground">
                  Page {currentPage} of {totalPages}
                </span>
                <button
                  className="rounded border px-3 py-1 disabled:opacity-50"
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage((p) => p + 1)}
                >
                  Next
                </button>
              </div>
            </>
          ) : (
            <div className="rounded-lg border border-border bg-card p-12 text-center">
              <p className="text-muted-foreground">No tenders match your filters.</p>
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
