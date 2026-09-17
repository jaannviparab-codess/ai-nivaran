"use client";

import { motion } from "framer-motion";
import { ArrowRight, Search, SearchX, Sparkles } from "lucide-react";
import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { StatusBadge } from "@/components/issues/StatusBadge";
import { SeverityBadge } from "@/components/issues/SeverityBadge";
import { PriorityScoreGauge } from "@/components/issues/PriorityScoreGauge";
import { Timeline } from "@/components/issues/Timeline";
import { getIssueByTrackingId } from "@/lib/api";
import type { Issue } from "@/lib/types";
import { useDocumentTitle } from "@/lib/hooks/useDocumentTitle";

type State = "idle" | "loading" | "found" | "not-found";

export default function TrackIssuePage() {
  useDocumentTitle("Track Your Report");
  const [trackingId, setTrackingId] = useState("");
  const [state, setState] = useState<State>("idle");
  const [issue, setIssue] = useState<Issue | null>(null);

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (!trackingId.trim()) return;
    setState("loading");
    const result = await getIssueByTrackingId(trackingId.trim());
    if (result) {
      setIssue(result);
      setState("found");
    } else {
      setIssue(null);
      setState("not-found");
    }
  }

  return (
    <div className="container max-w-2xl py-10 sm:py-14">
      <div className="mb-8 animate-fade-in-up text-center">
        <span className="mb-4 inline-flex items-center gap-2 rounded-full bg-primary-50 px-4 py-1.5 text-xs font-semibold text-primary-700">
          <Sparkles className="h-3.5 w-3.5" /> Live Status Lookup
        </span>
        <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">Track Your Report</h1>
        <p className="mt-2 text-muted-foreground">Enter the tracking ID you received after submitting a report.</p>
      </div>

      <form
        onSubmit={handleSearch}
        style={{ animationDelay: "0.1s" }}
        className="flex animate-fade-in-up flex-col gap-3 sm:flex-row"
      >
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={trackingId}
            onChange={(e) => setTrackingId(e.target.value)}
            placeholder="e.g. NVR-2026-1042"
            className="h-12 w-full rounded-xl border border-border pl-10 pr-3 text-sm outline-none transition-shadow focus-visible:shadow-glow focus-visible:ring-2 focus-visible:ring-primary-500"
          />
        </div>
        <Button type="submit" size="lg" loading={state === "loading"} rightIcon={<ArrowRight className="h-4 w-4" />}>
          Track
        </Button>
      </form>
      <p className="mt-2 text-center text-xs text-muted-foreground sm:text-left">
        Try a demo ID, e.g. <button type="button" className="font-medium text-primary-700 underline" onClick={() => setTrackingId("NVR-2026-1000")}>NVR-2026-1000</button>
      </p>

      {state === "not-found" && (
        <div className="mt-10">
          <EmptyState
            icon={SearchX}
            title="No report found with that ID"
            description="Double-check the tracking ID from your confirmation screen, or browse the public map instead."
            action={
              <Button href="/map" variant="outline" size="sm" className="mt-2">
                Browse public map
              </Button>
            }
          />
        </div>
      )}

      {state === "found" && issue && (
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="mt-10 space-y-5">
          <Card>
            <CardContent className="flex flex-col gap-4 pt-6 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-xs uppercase tracking-wide text-muted-foreground">{issue.trackingId}</p>
                <Link href={`/issues/${issue.id}`} className="text-lg font-semibold text-foreground hover:text-primary-700">
                  {issue.title}
                </Link>
                <div className="mt-2 flex flex-wrap gap-2">
                  <StatusBadge status={issue.status} />
                  <SeverityBadge severity={issue.severity} />
                </div>
              </div>
              {issue.priorityScore && <PriorityScoreGauge score={issue.priorityScore.score} size={88} />}
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <h3 className="mb-4 text-sm font-semibold text-foreground">Status Timeline</h3>
              <Timeline issue={issue} />
            </CardContent>
          </Card>

          <Button href={`/issues/${issue.id}`} variant="outline" className="w-full" rightIcon={<ArrowRight className="h-4 w-4" />}>
            View full details
          </Button>
        </motion.div>
      )}
    </div>
  );
}
