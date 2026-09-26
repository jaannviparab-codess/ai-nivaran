"use client";

import { motion } from "framer-motion";
import { CheckCircle2, Flame, MapPinned, Shield, Sparkles, Users } from "lucide-react";
import { useMemo, useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { SeverityBadge } from "@/components/issues/SeverityBadge";
import { StatusBadge } from "@/components/issues/StatusBadge";
import { SectionHeading } from "@/components/common/SectionHeading";
import { MOCK_ANALYTICS, MOCK_ISSUES } from "@/lib/mock-data";
import { Button } from "@/components/ui/Button";
import { useDocumentTitle } from "@/lib/hooks/useDocumentTitle";
import { useTranslation } from "@/i18n/I18nProvider";

function IssueRow({ id, title, meta, right }: { id: string; title: string; meta: string; right: React.ReactNode }) {
  return (
    <Link
      href={`/issues/${id}`}
      className="flex items-center justify-between gap-3 rounded-xl p-2.5 transition-all duration-200 hover:translate-x-0.5 hover:bg-muted"
    >
      <div className="min-w-0">
        <p className="truncate text-sm font-medium text-foreground">{title}</p>
        <p className="text-xs text-muted-foreground">{meta}</p>
      </div>
      <div className="shrink-0">{right}</div>
    </Link>
  );
}

function generateAreaInsight(ward: string) {
  const wardIssues = MOCK_ISSUES.filter((i) => i.location.ward === ward);
  const open = wardIssues.filter((i) => i.status !== "resolved" && i.status !== "citizen_verified");
  const counts = new Map<string, number>();
  for (const issue of wardIssues) counts.set(issue.category, (counts.get(issue.category) || 0) + 1);
  const topCategoryEntry = [...counts.entries()].sort((a, b) => b[1] - a[1])[0];
  // Category value (not a label) — the page translates it for display.
  const topCategory = topCategoryEntry ? topCategoryEntry[0] : null;
  const mostUrgent = [...open].sort((a, b) => (b.priorityScore?.score || 0) - (a.priorityScore?.score || 0))[0];
  const totalConfirmations = wardIssues.reduce((sum, i) => sum + i.confirmations.total, 0);

  return { wardIssues, open, topCategory, mostUrgent, totalConfirmations };
}

export default function CommunityPage() {
  const { t, tOptional, rich } = useTranslation();
  useDocumentTitle(t("communityPage.docTitle"));
  const trending = useMemo(() => [...MOCK_ISSUES].sort((a, b) => b.confirmations.total - a.confirmations.total).slice(0, 5), []);
  const critical = useMemo(
    () => MOCK_ISSUES.filter((i) => i.severity === "critical" && i.status !== "resolved").slice(0, 5),
    []
  );
  const resolved = useMemo(
    () => [...MOCK_ISSUES].filter((i) => i.resolution).sort((a, b) => +new Date(b.resolution!.resolvedAt) - +new Date(a.resolution!.resolvedAt)).slice(0, 5),
    []
  );

  const wards = MOCK_ANALYTICS.byArea.map((a) => a.ward);
  const [selectedWard, setSelectedWard] = useState(wards[0]);
  const insight = useMemo(() => generateAreaInsight(selectedWard), [selectedWard]);

  return (
    <div className="container py-10 sm:py-14">
      <SectionHeading
        align="left"
        eyebrow={t("communityPage.eyebrow")}
        title={t("communityPage.title")}
        description={t("communityPage.description")}
        className="mx-0 max-w-2xl text-left"
      />

      <div className="mt-10 grid gap-6 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Flame className="h-4 w-4 text-warning-500" /> {t("communityPage.trending")}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-1 pt-0">
            {trending.map((issue) => (
              <IssueRow
                key={issue.id}
                id={issue.id}
                title={issue.title}
                meta={issue.location.ward || ""}
                right={
                  <span className="flex items-center gap-1 text-xs font-semibold text-slate-500">
                    <Users className="h-3.5 w-3.5" /> {issue.confirmations.total}
                  </span>
                }
              />
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Shield className="h-4 w-4 text-critical-600" /> {t("communityPage.critical")}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-1 pt-0">
            {critical.map((issue) => (
              <IssueRow key={issue.id} id={issue.id} title={issue.title} meta={issue.location.ward || ""} right={<SeverityBadge severity={issue.severity} />} />
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <CheckCircle2 className="h-4 w-4 text-success-600" /> {t("communityPage.recentlyResolved")}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-1 pt-0">
            {resolved.map((issue) => (
              <IssueRow key={issue.id} id={issue.id} title={issue.title} meta={issue.location.ward || ""} right={<StatusBadge status={issue.status} />} />
            ))}
          </CardContent>
        </Card>
      </div>

      <div className="mt-10 grid gap-6 lg:grid-cols-5">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <MapPinned className="h-4 w-4 text-primary-600" /> {t("communityPage.mostReported")}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 pt-0">
            {MOCK_ANALYTICS.byArea.map((area) => {
              const max = MOCK_ANALYTICS.byArea[0].count;
              return (
                <div key={area.ward}>
                  <div className="mb-1 flex items-center justify-between text-xs">
                    <span className="font-medium text-slate-700">{area.ward}</span>
                    <span className="text-muted-foreground">
                      {t("communityPage.areaCounts", { count: area.count, resolved: area.resolvedCount })}
                    </span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                    <motion.div
                      initial={{ width: 0 }}
                      whileInView={{ width: `${(area.count / max) * 100}%` }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.8, ease: "easeOut" }}
                      className="h-full rounded-full bg-gradient-to-r from-primary-600 to-secondary-600"
                    />
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>

        <Card className="lg:col-span-3 overflow-hidden">
          <div className="bg-gradient-to-br from-primary-600 to-secondary-600 p-6 text-white">
            <p className="flex items-center gap-2 text-sm font-semibold">
              <Sparkles className="h-4 w-4 shrink-0" /> {t("communityPage.askTitle")}
            </p>
            <p className="mt-1 text-xs text-white/80">{t("communityPage.askSubtitle")}</p>
            <select
              value={selectedWard}
              onChange={(e) => setSelectedWard(e.target.value)}
              aria-label={t("communityPage.selectArea")}
              className="mt-4 h-10 w-full max-w-xs rounded-lg border-0 bg-white/15 px-3 text-sm text-white outline-none ring-1 ring-white/30 [&>option]:text-slate-900"
            >
              {wards.map((w) => (
                <option key={w} value={w}>
                  {w}
                </option>
              ))}
            </select>
          </div>
          <CardContent className="space-y-3 pt-6">
            {insight.mostUrgent ? (
              <>
                <p className="text-sm text-foreground">
                  {rich(
                    insight.open.length === 1 ? "communityPage.insight.one" : "communityPage.insight.other",
                    {
                      ward: selectedWard,
                      category: insight.topCategory
                        ? tOptional(`category.${insight.topCategory}`, insight.topCategory)
                        : t("communityPage.variedIssues"),
                      open: insight.open.length,
                      total: insight.wardIssues.length,
                    },
                    { b: (chunk) => <strong>{chunk}</strong> }
                  )}
                </p>
                <div className="rounded-xl bg-muted p-3">
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{t("communityPage.topPriority")}</p>
                  <Link href={`/issues/${insight.mostUrgent.id}`} className="text-sm font-medium text-primary-700 hover:underline">
                    {insight.mostUrgent.title}
                  </Link>
                  <p className="text-xs text-muted-foreground">
                    {t("communityPage.priorityLine", {
                      score: insight.mostUrgent.priorityScore?.score ?? 0,
                      confirmations: insight.totalConfirmations,
                    })}
                  </p>
                </div>
                <Button href="/map" size="sm" variant="outline">
                  {t("communityPage.viewOnMap", { ward: selectedWard })}
                </Button>
              </>
            ) : (
              <p className="text-sm text-muted-foreground">{t("communityPage.noOpen", { ward: selectedWard })}</p>
            )}
            <p className="text-xs text-muted-foreground">
              {t("communityPage.disclaimer")}
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
