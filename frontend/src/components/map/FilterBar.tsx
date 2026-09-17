"use client";

import { Flame, Search, X } from "lucide-react";
import { ISSUE_CATEGORIES } from "@/lib/types";
import type { IssueFilters, IssueSeverity, IssueStatus } from "@/lib/types";
import { SEVERITY_META, STATUS_META } from "@/lib/constants";
import { cn } from "@/lib/utils";

const SEVERITIES: IssueSeverity[] = ["low", "medium", "high", "critical"];
const STATUSES: IssueStatus[] = ["reported", "ai_analyzed", "verified", "under_review", "work_started", "resolved", "citizen_verified"];

export function FilterBar({
  filters,
  onChange,
  heatmap,
  onHeatmapChange,
  resultCount,
}: {
  filters: IssueFilters;
  onChange: (filters: IssueFilters) => void;
  heatmap: boolean;
  onHeatmapChange: (v: boolean) => void;
  resultCount: number;
}) {
  function toggleArrayValue<T extends string>(key: "category" | "severity" | "status", value: T) {
    const current = (filters[key] as T[] | undefined) || [];
    const next = current.includes(value) ? current.filter((v) => v !== value) : [...current, value];
    onChange({ ...filters, [key]: next.length ? next : undefined });
  }

  const hasActiveFilters = !!(filters.category?.length || filters.severity?.length || filters.status?.length || filters.search);

  return (
    <div className="space-y-5">
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          value={filters.search || ""}
          onChange={(e) => onChange({ ...filters, search: e.target.value || undefined })}
          placeholder="Search issues or tracking ID…"
          className="h-10 w-full rounded-xl border border-border pl-9 pr-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
        />
      </div>

      <div className="flex items-center justify-between rounded-xl bg-muted/60 px-3 py-2.5">
        <span className="flex items-center gap-1.5 text-xs font-medium text-slate-600">
          <Flame className="h-3.5 w-3.5 text-critical-500" /> Heatmap view
        </span>
        <button
          role="switch"
          aria-checked={heatmap}
          onClick={() => onHeatmapChange(!heatmap)}
          className={cn("relative h-6 w-11 rounded-full transition-colors", heatmap ? "bg-primary-600" : "bg-slate-300")}
        >
          <span className={cn("absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform", heatmap ? "translate-x-5" : "translate-x-0.5")} />
        </button>
      </div>

      <div>
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Category</p>
        <div className="flex flex-wrap gap-1.5">
          {ISSUE_CATEGORIES.map((c) => (
            <button
              key={c.value}
              onClick={() => toggleArrayValue("category", c.value)}
              className={cn(
                "rounded-full border px-2.5 py-1 text-[11px] font-medium transition-all duration-150 active:scale-95",
                filters.category?.includes(c.value)
                  ? "border-primary-600 bg-primary-50 text-primary-700"
                  : "border-border text-slate-500 hover:border-primary-200 hover:text-primary-700"
              )}
            >
              {c.labelEn}
            </button>
          ))}
        </div>
      </div>

      <div>
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Severity</p>
        <div className="flex flex-wrap gap-1.5">
          {SEVERITIES.map((s) => (
            <button
              key={s}
              onClick={() => toggleArrayValue("severity", s)}
              className={cn(
                "flex items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] font-medium transition-all duration-150 active:scale-95",
                filters.severity?.includes(s)
                  ? "border-primary-600 bg-primary-50 text-primary-700"
                  : "border-border text-slate-500 hover:border-primary-200 hover:text-primary-700"
              )}
            >
              <span className={cn("h-1.5 w-1.5 rounded-full", SEVERITY_META[s].dot)} />
              {SEVERITY_META[s].label}
            </button>
          ))}
        </div>
      </div>

      <div>
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Status</p>
        <div className="flex flex-wrap gap-1.5">
          {STATUSES.map((s) => (
            <button
              key={s}
              onClick={() => toggleArrayValue("status", s)}
              className={cn(
                "rounded-full border px-2.5 py-1 text-[11px] font-medium transition-all duration-150 active:scale-95",
                filters.status?.includes(s)
                  ? "border-primary-600 bg-primary-50 text-primary-700"
                  : "border-border text-slate-500 hover:border-primary-200 hover:text-primary-700"
              )}
            >
              {STATUS_META[s].label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex items-center justify-between border-t border-border pt-3 text-xs text-muted-foreground">
        <span>{resultCount} issue{resultCount === 1 ? "" : "s"} found</span>
        {hasActiveFilters && (
          <button onClick={() => onChange({})} className="flex items-center gap-1 font-medium text-primary-700 hover:underline">
            <X className="h-3 w-3" /> Clear filters
          </button>
        )}
      </div>
    </div>
  );
}
