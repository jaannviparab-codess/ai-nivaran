"use client";

import { motion } from "framer-motion";
import { ArrowLeft, Calendar, Copy, MapPin, ThumbsDown, ThumbsUp, Users } from "lucide-react";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { StatusBadge } from "@/components/issues/StatusBadge";
import { SeverityBadge } from "@/components/issues/SeverityBadge";
import { AIAnalysisCard } from "@/components/issues/AIAnalysisCard";
import { PriorityScoreBreakdownCard } from "@/components/issues/PriorityScoreBreakdownCard";
import { Timeline } from "@/components/issues/Timeline";
import { BeforeAfterSlider } from "@/components/issues/BeforeAfterSlider";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { LoadingState } from "@/components/ui/LoadingState";
import { ErrorState } from "@/components/ui/ErrorState";
import { useToast } from "@/components/ui/Toast";
import { getIssueById, confirmIssue, verifyIssueResolution } from "@/lib/api";
import { ISSUE_CATEGORIES } from "@/lib/types";
import type { Issue } from "@/lib/types";
import { formatDate, formatRelativeTime } from "@/lib/utils";
import { useDocumentTitle } from "@/lib/hooks/useDocumentTitle";

export default function IssueDetailPage() {
  const params = useParams<{ id: string }>();
  const { show } = useToast();
  const [issue, setIssue] = useState<Issue | null | undefined>(undefined);
  const [error, setError] = useState(false);
  const [voted, setVoted] = useState<string | null>(null);
  useDocumentTitle(issue ? issue.title : "Issue Details");

  async function load() {
    setError(false);
    setIssue(undefined);
    try {
      const data = await getIssueById(params.id);
      setIssue(data);
    } catch {
      setError(true);
    }
  }

  useEffect(() => {
    load();
    if (typeof window !== "undefined") {
      setVoted(window.localStorage.getItem(`nvr-vote-${params.id}`));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.id]);

  async function handleConfirm(stillPresent: boolean) {
    if (!issue) return;
    await confirmIssue(issue.id, stillPresent);
    window.localStorage.setItem(`nvr-vote-${issue.id}`, stillPresent ? "present" : "resolved");
    setVoted(stillPresent ? "present" : "resolved");
    show({ kind: "success", title: "Thanks for confirming!", description: "Your input helps prioritize this issue." });
    load();
  }

  async function handleVerify(confirmed: boolean) {
    if (!issue) return;
    await verifyIssueResolution(issue.id, confirmed);
    show({
      kind: confirmed ? "success" : "info",
      title: confirmed ? "Marked as verified fixed" : "Reported as still broken",
      description: confirmed ? "Thanks for closing the loop." : "This issue has been reopened for review.",
    });
    load();
  }

  if (error) {
    return (
      <div className="container max-w-3xl py-14">
        <ErrorState onRetry={load} description="Couldn't load this issue. Please try again." />
      </div>
    );
  }

  if (issue === undefined) {
    return <LoadingState label="Loading issue details…" className="py-24" />;
  }

  if (issue === null) {
    return (
      <div className="container max-w-3xl py-14">
        <ErrorState title="Issue not found" description="This report may have been removed, or the link is incorrect." />
      </div>
    );
  }

  const categoryMeta = ISSUE_CATEGORIES.find((c) => c.value === issue.category);
  const isResolvedLike = issue.status === "resolved" || issue.status === "citizen_verified";

  return (
    <div className="container max-w-4xl py-8 sm:py-12">
      <Button href="/map" variant="ghost" size="sm" leftIcon={<ArrowLeft className="h-4 w-4" />} className="mb-6">
        Back to map
      </Button>

      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="space-y-6">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge status={issue.status} />
            <SeverityBadge severity={issue.severity} />
            {issue.isDemo && (
              <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-500">Demo report</span>
            )}
          </div>
          <h1 className="mt-3 text-2xl font-bold tracking-tight text-foreground sm:text-3xl">{issue.title}</h1>
          <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
            <span className="flex items-center gap-1">
              <MapPin className="h-3.5 w-3.5" />{" "}
              {[issue.location.ward, issue.location.city].filter(Boolean).join(", ") ||
                `${issue.location.lat.toFixed(4)}, ${issue.location.lng.toFixed(4)}`}
            </span>
            <span className="flex items-center gap-1">
              <Calendar className="h-3.5 w-3.5" /> Reported {formatRelativeTime(issue.reportedAt)}
            </span>
            <button
              onClick={() => {
                navigator.clipboard?.writeText(issue.trackingId);
                show({ kind: "info", title: "Tracking ID copied" });
              }}
              className="flex items-center gap-1 font-medium text-primary-700 hover:underline"
            >
              <Copy className="h-3.5 w-3.5" /> {issue.trackingId}
            </button>
          </div>
        </div>

        {issue.images[0] && (
          <div className="overflow-hidden rounded-2xl border border-border">
            <img src={issue.images[0].url} alt={`Photo of ${categoryMeta?.labelEn}`} className="max-h-[420px] w-full object-cover" />
          </div>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Description</CardTitle>
          </CardHeader>
          <CardContent className="pt-0 text-sm text-slate-600">{issue.description}</CardContent>
        </Card>

        {issue.aiAnalysis && <AIAnalysisCard analysis={issue.aiAnalysis} priority={issue.priorityScore} />}

        {issue.duplicateInfo?.isDuplicateGroup && (
          <div className="flex items-center gap-3 rounded-2xl border border-primary-100 bg-primary-50 p-4 text-sm text-primary-800">
            <Users className="h-5 w-5 shrink-0" />
            <p>
              This is a grouped issue — <strong>{issue.duplicateInfo.groupedReportCount} citizen reports</strong> and{" "}
              <strong>{issue.duplicateInfo.confirmations} confirmations</strong> point to the same underlying problem.
            </p>
          </div>
        )}

        {issue.priorityScore && <PriorityScoreBreakdownCard breakdown={issue.priorityScore} />}

        <Card>
          <CardHeader>
            <CardTitle>Is this problem still there?</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <p className="mb-4 text-sm text-muted-foreground">
              {issue.confirmations.total} citizen{issue.confirmations.total === 1 ? "" : "s"} confirmed this report so far
              (~{issue.confirmations.peopleAffectedEstimate} people estimated affected).
            </p>
            {voted ? (
              <p className="rounded-xl bg-muted px-4 py-3 text-sm text-muted-foreground">
                Thanks — you already confirmed this as{" "}
                <strong>{voted === "present" ? "still present" : "resolved"}</strong>.
              </p>
            ) : (
              <div className="flex flex-col gap-3 sm:flex-row">
                <Button variant="outline" className="flex-1" leftIcon={<ThumbsUp className="h-4 w-4" />} onClick={() => handleConfirm(true)}>
                  Yes, still a problem
                </Button>
                <Button variant="outline" className="flex-1" leftIcon={<ThumbsDown className="h-4 w-4" />} onClick={() => handleConfirm(false)}>
                  No, it’s fixed
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {isResolvedLike && issue.resolution && (
          <Card>
            <CardHeader>
              <CardTitle>Resolution Evidence</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 pt-0">
              <BeforeAfterSlider beforeUrl={issue.resolution.beforeImageUrl!} afterUrl={issue.resolution.afterImageUrl!} />
              <p className="text-sm text-muted-foreground">
                {issue.resolution.resolutionNote} — resolved {formatDate(issue.resolution.resolvedAt)} by{" "}
                {issue.resolution.resolvedByLabel}.
              </p>
              {issue.status === "resolved" && (
                <div className="flex flex-col gap-3 sm:flex-row">
                  <Button className="flex-1" leftIcon={<ThumbsUp className="h-4 w-4" />} onClick={() => handleVerify(true)}>
                    Confirm it’s fixed
                  </Button>
                  <Button variant="outline" className="flex-1" leftIcon={<ThumbsDown className="h-4 w-4" />} onClick={() => handleVerify(false)}>
                    Still broken
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Resolution Timeline</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <Timeline issue={issue} />
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
