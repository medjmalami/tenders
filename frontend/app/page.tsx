"use client";

import { useEffect, useMemo, useState } from "react";
import { AppLayout } from "@/components/app-layout";
import { DashboardStats } from "@/components/dashboard-stats";
import { type FilterState, TenderFilters } from "@/components/tender-filters";
import { TenderTable } from "@/components/tender-table";
import { getAllTenders } from "@/lib/mock-data";
import type { Tender } from "@/lib/types";

const PAGE_SIZE = 10;

export default function Dashboard() {
  const [filters, setFilters] = useState<FilterState>({
    statuses: [],
  });

  const [currentPage, setCurrentPage] = useState(1);

  const allTenders = getAllTenders();

  const filteredTenders = useMemo(() => {
    const tenders = allTenders.filter((tender: Tender) => {
      if (
        filters.statuses.length > 0 &&
        !filters.statuses.includes(tender.status)
      ) {
        return false;
      }

      if (filters.institution && tender.institution !== filters.institution) {
        return false;
      }

      if (filters.dateRange && tender.finalSubmissionDate) {
        const deadline = new Date(tender.finalSubmissionDate);

        if (
          deadline < filters.dateRange.from ||
          deadline > filters.dateRange.to
        ) {
          return false;
        }
      }

      return true;
    });

    tenders.sort((a, b) => {
      const dateA = a.finalSubmissionDate
        ? new Date(a.finalSubmissionDate).getTime()
        : Infinity;

      const dateB = b.finalSubmissionDate
        ? new Date(b.finalSubmissionDate).getTime()
        : Infinity;

      return dateA - dateB;
    });

    return tenders;
  }, [allTenders, filters]);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [filters]);

  const totalPages = Math.ceil(filteredTenders.length / PAGE_SIZE);

  const paginatedTenders = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    const end = start + PAGE_SIZE;

    return filteredTenders.slice(start, end);
  }, [filteredTenders, currentPage]);

  return (
    <AppLayout>
      <div className="space-y-8 p-8">
        <div>
          <h1 className="text-3xl font-bold text-foreground">
            Dashboard
          </h1>
          <p className="mt-2 text-muted-foreground">
            Overview of government tenders with AI-powered analysis
          </p>
        </div>

        <DashboardStats />

        <TenderFilters
          onFiltersChange={(newFilters) => {
            setFilters(newFilters);
            setCurrentPage(1);
          }}
        />

        <div>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-foreground">
              Tenders ({filteredTenders.length})
            </h2>
          </div>

          {paginatedTenders.length > 0 ? (
            <>
              <TenderTable tenders={paginatedTenders} />

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
              <p className="text-muted-foreground">
                No tenders match your filters.
              </p>
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
