"use client";

import { AlertOctagon, CheckCircle2, Clock, FileStack, FlaskConical, ListChecks, Users2 } from "lucide-react";
import { useEffect, useState } from "react";
import { SectionHeading } from "@/components/common/SectionHeading";
import { RevealOnScroll } from "@/components/common/RevealOnScroll";
import { StatisticsCard } from "@/components/charts/StatisticsCard";
import { TrendAreaChart } from "@/components/charts/TrendAreaChart";
import { CategoryBarChart } from "@/components/charts/CategoryBarChart";
import { ResolvedDonutChart } from "@/components/charts/ResolvedDonutChart";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { MapLegend } from "@/components/map/MapLegend";
import { IssueMapLoader } from "@/components/map/IssueMapLoader";
import { LoadingState } from "@/components/ui/LoadingState";
import { getAnalytics, getIssueMapData } from "@/lib/api";
import type { AnalyticsSnapshot, IssueListItem } from "@/lib/types";
import { useDocumentTitle } from "@/lib/hooks/useDocumentTitle";
import { DEMO_MODE } from "@/lib/constants";
import { useTranslation } from "@/i18n/I18nProvider";

export default function AnalyticsPage() {
  const { t, formatNumber } = useTranslation();
  useDocumentTitle(t("analyticsPage.docTitle"));
  const [data, setData] = useState<AnalyticsSnapshot | null>(null);
  const [issues, setIssues] = useState<IssueListItem[]>([]);

  useEffect(() => {
    getAnalytics().then(setData);
    getIssueMapData().then(setIssues);
  }, []);

  if (!data) return <LoadingState label={t("analyticsPage.loading")} className="py-24" />;

  return (
    <div className="container py-10 sm:py-14">
      <SectionHeading
        align="left"
        eyebrow={t("analyticsPage.eyebrow")}
        title={t("analyticsPage.title")}
        description={t("analyticsPage.description")}
        className="mx-0 max-w-2xl text-left"
      />
      {DEMO_MODE && (
        <p className="mt-3 flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
          <FlaskConical className="h-3.5 w-3.5 shrink-0 text-primary-500" /> {t("stats.demoNotice")}
        </p>
      )}

      <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-5">
        <StatisticsCard icon={FileStack} label={t("stats.totalReports")} value={data.stats.totalReports} suffix="+" accent="primary" />
        <StatisticsCard icon={ListChecks} label={t("stats.activeIssues")} value={data.stats.activeIssues} accent="warning" delay={0.05} />
        <StatisticsCard icon={CheckCircle2} label={t("stats.resolvedIssues")} value={data.stats.resolvedIssues} accent="success" delay={0.1} />
        <StatisticsCard icon={AlertOctagon} label={t("stats.criticalIssues")} value={data.stats.criticalIssues} accent="critical" delay={0.15} />
        <StatisticsCard icon={Clock} label={t("stats.avgResolution")} value={data.stats.avgResolutionDays} decimals={1} accent="primary" delay={0.2} />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <RevealOnScroll className="lg:col-span-2">
          <Card className="h-full">
            <CardHeader>
              <CardTitle>{t("analyticsPage.monthly")}</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <TrendAreaChart data={data.monthlyTrend} />
            </CardContent>
          </Card>
        </RevealOnScroll>

        <RevealOnScroll delay={0.1}>
          <Card className="h-full">
            <CardHeader>
              <CardTitle>{t("analyticsPage.resolvedVsActive")}</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <ResolvedDonutChart resolved={data.resolvedVsActive.resolved} active={data.resolvedVsActive.active} />
            </CardContent>
          </Card>
        </RevealOnScroll>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <RevealOnScroll>
          <Card className="h-full">
            <CardHeader>
              <CardTitle>{t("analyticsPage.byCategory")}</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <CategoryBarChart data={data.byCategory} />
            </CardContent>
          </Card>
        </RevealOnScroll>

        <RevealOnScroll delay={0.1}>
          <Card className="h-full">
            <CardHeader>
              <CardTitle className="flex flex-wrap items-center justify-between gap-2">
                <span>{t("analyticsPage.byArea")}</span>
                <span className="flex items-center gap-1 text-xs font-normal text-muted-foreground">
                  <Users2 className="h-3.5 w-3.5" /> {t("analyticsPage.totalConfirmations", { count: formatNumber(data.stats.communityConfirmations) })}
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 pt-0">
              {data.byArea.map((area) => (
                <div key={area.ward} className="flex items-center justify-between text-sm">
                  <span className="font-medium text-slate-700">{area.ward}</span>
                  <div className="flex items-center gap-2">
                    <div className="h-1.5 w-28 overflow-hidden rounded-full bg-muted">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-primary-600 to-secondary-600"
                        style={{ width: `${(area.count / data.byArea[0].count) * 100}%` }}
                      />
                    </div>
                    <span className="w-8 text-right text-xs text-muted-foreground">{area.count}</span>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </RevealOnScroll>
      </div>

      <RevealOnScroll delay={0.1} className="mt-6">
        <Card className="overflow-hidden">
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <CardTitle>{t("analyticsPage.heatmap")}</CardTitle>
            <Button href="/map" size="sm" variant="outline">
              {t("analyticsPage.openMap")}
            </Button>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="relative h-80 overflow-hidden rounded-2xl border border-border">
              <IssueMapLoader issues={issues} heatmap scrollWheelZoom={false} />
              <div className="glass pointer-events-none absolute left-3 top-3 rounded-lg px-3 py-1.5">
                <MapLegend className="flex gap-3" />
              </div>
            </div>
          </CardContent>
        </Card>
      </RevealOnScroll>
    </div>
  );
}
