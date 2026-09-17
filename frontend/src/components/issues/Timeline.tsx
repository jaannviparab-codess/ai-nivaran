"use client";

import { motion } from "framer-motion";
import {
  BadgeCheck,
  Bot,
  CheckCircle2,
  ClipboardList,
  Hammer,
  RotateCcw,
  Search,
  ShieldCheck,
  type LucideIcon,
} from "lucide-react";
import { ISSUE_STATUS_STEPS, type Issue, type StatusStep } from "@/lib/types";
import { formatDateTime } from "@/lib/utils";
import { cn } from "@/lib/utils";

const STEP_META: Record<StatusStep, { label: string; icon: LucideIcon }> = {
  reported: { label: "Reported", icon: ClipboardList },
  ai_analyzed: { label: "AI Analyzed", icon: Bot },
  verified: { label: "Verified", icon: ShieldCheck },
  under_review: { label: "Under Review", icon: Search },
  work_started: { label: "Work Started", icon: Hammer },
  resolved: { label: "Resolved", icon: CheckCircle2 },
  citizen_verified: { label: "Citizen Verified", icon: BadgeCheck },
};

export function Timeline({ issue }: { issue: Issue }) {
  const currentIndex = ISSUE_STATUS_STEPS.indexOf(issue.status as StatusStep);
  const isReopened = issue.status === "reopened";

  return (
    <ol className="relative space-y-0">
      {ISSUE_STATUS_STEPS.map((step, index) => {
        const meta = STEP_META[step];
        const historyEntry = issue.statusHistory.find((h) => h.status === step);
        const completed = isReopened ? index <= 4 : index <= currentIndex;
        const isCurrent = !isReopened && index === currentIndex;
        const isLast = index === ISSUE_STATUS_STEPS.length - 1;

        return (
          <li key={step} className="group relative flex gap-4 rounded-xl p-1 pb-8 transition-colors duration-200 hover:bg-muted/50 last:pb-0">
            {!isLast && (
              <span
                className={cn(
                  "absolute left-5 top-10 h-[calc(100%-2.5rem)] w-0.5",
                  completed ? "bg-gradient-to-b from-primary-500 to-cyan-400" : "bg-border"
                )}
              />
            )}
            <motion.div
              initial={{ scale: 0.7, opacity: 0 }}
              whileInView={{ scale: 1, opacity: 1 }}
              whileHover={{ scale: 1.08 }}
              viewport={{ once: true }}
              transition={{ duration: 0.35, delay: index * 0.08 }}
              className={cn(
                "relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 transition-shadow duration-200",
                completed
                  ? "border-primary-600 bg-primary-600 text-white group-hover:shadow-glow"
                  : "border-border bg-white text-muted-foreground",
                isCurrent && "ring-4 ring-primary-100"
              )}
            >
              <meta.icon className="h-4.5 w-4.5" />
              {isCurrent && <span className="absolute inset-0 -z-10 animate-pulse-ring rounded-full border-2 border-primary-400" />}
            </motion.div>
            <div className="flex-1 pt-1.5">
              <p className={cn("text-sm font-semibold", completed ? "text-foreground" : "text-muted-foreground")}>
                {meta.label}
              </p>
              {historyEntry ? (
                <>
                  <p className="mt-0.5 text-xs text-muted-foreground">{historyEntry.note}</p>
                  <p className="mt-1 text-[11px] text-slate-400">{formatDateTime(historyEntry.createdAt)}</p>
                </>
              ) : (
                <p className="mt-0.5 text-xs text-slate-400">Pending</p>
              )}
            </div>
          </li>
        );
      })}
      {isReopened && (
        <li className="relative flex gap-4 pt-2">
          <div className="relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 border-critical-500 bg-critical-50 text-critical-600">
            <RotateCcw className="h-4.5 w-4.5" />
          </div>
          <div className="flex-1 pt-1.5">
            <p className="text-sm font-semibold text-critical-600">Reopened</p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Multiple citizens reported the issue is still present. Sent back for review.
            </p>
          </div>
        </li>
      )}
    </ol>
  );
}
