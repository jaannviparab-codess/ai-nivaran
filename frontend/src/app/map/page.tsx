"use client";

import { useEffect, useMemo, useState } from "react";
import { MapPinOff, SlidersHorizontal, X } from "lucide-react";
import { FilterBar } from "@/components/map/FilterBar";
import { MapLegend } from "@/components/map/MapLegend";
import { IssueMapLoader } from "@/components/map/IssueMapLoader";
import { IssueCard, IssueCardSkeleton } from "@/components/issues/IssueCard";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { getIssues } from "@/lib/api";
import type { IssueFilters, IssueListItem } from "@/lib/types";
import { useDocumentTitle } from "@/lib/hooks/useDocumentTitle";

export default function MapPage() {
  useDocumentTitle("Public Issue Map");
  const [filters, setFilters] = useState<IssueFilters>({});
  const [issues, setIssues] = useState<IssueListItem[] | null>(null);
  const [error, setError] = useState(false);
  const [heatmap, setHeatmap] = useState(false);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<string | undefined>(undefined);

  async function load() {
    setError(false);
    try {
      const data = await getIssues(filters);
      setIssues(data);
    } catch {
      setError(true);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(filters)]);

  const listIssues = useMemo(() => issues ?? [], [issues]);

  return (
    <div className="container py-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">Public Issue Map</h1>
          <p className="mt-1 text-sm text-muted-foreground">Every reported issue, filterable by category, severity and status.</p>
        </div>
        <button
          onClick={() => setMobileFiltersOpen(true)}
          className="flex items-center gap-1.5 rounded-xl border border-border px-3 py-2 text-sm font-medium lg:hidden"
        >
          <SlidersHorizontal className="h-4 w-4" /> Filters
        </button>
      </div>

      <div className="flex flex-col gap-6 lg:flex-row">
        <aside className="hidden w-80 shrink-0 lg:block">
          <div className="sticky top-24 max-h-[calc(100vh-7rem)] overflow-y-auto rounded-2xl border border-border bg-white p-4 shadow-card">
            <FilterBar filters={filters} onChange={setFilters} heatmap={heatmap} onHeatmapChange={setHeatmap} resultCount={listIssues.length} />
          </div>
        </aside>

        {mobileFiltersOpen && (
          <div className="fixed inset-0 z-[95] flex lg:hidden">
            <div className="absolute inset-0 bg-slate-900/40" onClick={() => setMobileFiltersOpen(false)} />
            <div className="relative ml-auto h-full w-[85%] max-w-sm overflow-y-auto bg-white p-4 shadow-xl">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-sm font-semibold">Filters</h2>
                <button onClick={() => setMobileFiltersOpen(false)} aria-label="Close filters">
                  <X className="h-5 w-5" />
                </button>
              </div>
              <FilterBar filters={filters} onChange={setFilters} heatmap={heatmap} onHeatmapChange={setHeatmap} resultCount={listIssues.length} />
            </div>
          </div>
        )}

        <div className="grid flex-1 gap-6 xl:grid-cols-[1fr_360px]">
          <div className="relative h-[70vh] min-h-[420px] overflow-hidden rounded-2xl border border-border shadow-card xl:h-[calc(100vh-11rem)]">
            <IssueMapLoader issues={listIssues} heatmap={heatmap} selectedId={selectedId} />
            <div className="glass pointer-events-none absolute left-4 top-4 flex flex-wrap gap-3 rounded-xl px-3 py-2">
              <MapLegend className="flex flex-wrap gap-3" />
            </div>
          </div>

          <div className="max-h-[420px] space-y-3 overflow-y-auto xl:max-h-[calc(100vh-11rem)]">
            {error && <ErrorState onRetry={load} description="Couldn't load issues. Please try again." />}
            {!error && issues === null && Array.from({ length: 4 }).map((_, i) => <IssueCardSkeleton key={i} />)}
            {!error && issues && issues.length === 0 && (
              <EmptyState icon={MapPinOff} title="No issues match these filters" description="Try clearing some filters to see more results." />
            )}
            {!error &&
              issues &&
              issues.map((issue, i) => (
                <div key={issue.id} onMouseEnter={() => setSelectedId(issue.id)}>
                  <IssueCard issue={issue} index={i} />
                </div>
              ))}
          </div>
        </div>
      </div>
    </div>
  );
}
