"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { MapPin, Users } from "lucide-react";
import { StatusBadge } from "./StatusBadge";
import { SeverityBadge } from "./SeverityBadge";
import { ISSUE_CATEGORIES } from "@/lib/types";
import type { IssueListItem } from "@/lib/types";
import { formatRelativeTime } from "@/lib/utils";

export function IssueCard({ issue, index = 0 }: { issue: IssueListItem; index?: number }) {
  const categoryMeta = ISSUE_CATEGORIES.find((c) => c.value === issue.category);

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.4, delay: Math.min(index * 0.05, 0.4) }}
      whileHover={{ y: -3 }}
    >
      <Link
        href={`/issues/${issue.id}`}
        className="group flex gap-4 rounded-2xl border border-border bg-card p-3 shadow-card transition-shadow hover:shadow-glow focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
      >
        <div className="h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-muted sm:h-24 sm:w-24">
          {issue.thumbnailUrl && (
            <img src={issue.thumbnailUrl} alt="" className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105" />
          )}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <p className="truncate text-sm font-semibold text-foreground group-hover:text-primary-700">{issue.title}</p>
            <span className="shrink-0 rounded-md bg-muted px-1.5 py-0.5 text-[10px] font-semibold text-slate-500">
              {issue.priorityScore}
            </span>
          </div>
          <p className="mt-0.5 text-xs text-muted-foreground">{categoryMeta?.labelEn}</p>
          <div className="mt-2 flex flex-wrap items-center gap-1.5">
            <SeverityBadge severity={issue.severity} />
            <StatusBadge status={issue.status} />
          </div>
          <div className="mt-2 flex items-center gap-3 text-[11px] text-muted-foreground">
            <span className="flex items-center gap-1">
              <Users className="h-3 w-3" /> {issue.confirmationCount}
            </span>
            <span className="flex items-center gap-1">
              <MapPin className="h-3 w-3" /> {issue.trackingId}
            </span>
            <span className="ml-auto">{formatRelativeTime(issue.reportedAt)}</span>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}

export function IssueCardSkeleton() {
  return (
    <div className="flex gap-4 rounded-2xl border border-border bg-card p-3">
      <div className="skeleton h-20 w-20 shrink-0 rounded-xl sm:h-24 sm:w-24" />
      <div className="flex-1 space-y-2 py-1">
        <div className="skeleton h-4 w-3/4 rounded" />
        <div className="skeleton h-3 w-1/2 rounded" />
        <div className="skeleton h-5 w-2/3 rounded-full" />
      </div>
    </div>
  );
}
