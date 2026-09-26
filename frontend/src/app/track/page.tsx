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
import { useTranslation } from "@/i18n/I18nProvider";

type State = "idle" | "loading" | "found" | "not-found";

export default function TrackIssuePage() {
  const { t } = useTranslation();
  useDocumentTitle(t("track.docTitle"));
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
          <Sparkles className="h-3.5 w-3.5" /> {t("track.badge")}
        </span>
        <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">{t("track.title")}</h1>
        <p className="mt-2 text-muted-foreground">{t("track.subtitle")}</p>
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
            placeholder={t("track.placeholder")}
            aria-label={t("track.inputLabel")}
            className="h-12 w-full rounded-xl border border-border pl-10 pr-3 text-sm outline-none transition-shadow focus-visible:shadow-glow focus-visible:ring-2 focus-visible:ring-primary-500"
          />
        </div>
        <Button type="submit" size="lg" loading={state === "loading"} rightIcon={<ArrowRight className="h-4 w-4" />}>
          {t("track.submit")}
        </Button>
      </form>
      <p className="mt-2 text-center text-xs text-muted-foreground sm:text-left">
        {t("track.tryDemo")} <button type="button" className="font-medium text-primary-700 underline" onClick={() => setTrackingId("NVR-2026-1000")}>NVR-2026-1000</button>
      </p>

      {state === "not-found" && (
        <div className="mt-10">
          <EmptyState
            icon={SearchX}
            title={t("track.notFoundTitle")}
            description={t("track.notFoundDescription")}
            action={
              <Button href="/map" variant="outline" size="sm" className="mt-2">
                {t("track.browseMap")}
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
              <h3 className="mb-4 text-sm font-semibold text-foreground">{t("track.statusTimeline")}</h3>
              <Timeline issue={issue} />
            </CardContent>
          </Card>

          <Button href={`/issues/${issue.id}`} variant="outline" className="w-full" rightIcon={<ArrowRight className="h-4 w-4" />}>
            {t("track.viewDetails")}
          </Button>
        </motion.div>
      )}
    </div>
  );
}
