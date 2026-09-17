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

export default function AnalyticsPage() {
  useDocumentTitle("Analytics Dashboard");
  const [data, setData] = useState<AnalyticsSnapshot | null>(null);
  const [issues, setIssues] = useState<IssueListItem[]>([]);

  useEffect(() => {
    getAnalytics().then(setData);
    getIssueMapData().then(setIssues);
  }, []);

  if (!data) return <LoadingState label="Loading analytics…" className="py-24" />;

  return (
    <div className="container py-10 sm:py-14">
      <SectionHeading
        align="left"
        eyebrow="Public Transparency"
        title="Analytics Dashboard"
        description="The same data behind every priority score and status update — open for anyone to inspect."
        className="mx-0 max-w-2xl text-left"
      />
      {DEMO_MODE && (
        <p className="mt-3 flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
          <FlaskConical className="h-3.5 w-3.5 text-primary-500" /> Demo/sample statistics for this showcase build —
          not live production figures.
        </p>
      )}

      <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-5">
        <StatisticsCard icon={FileStack} label="Total Reports" value={data.stats.totalReports} suffix="+" accent="primary" />
        <StatisticsCard icon={ListChecks} label="Active Issues" value={data.stats.activeIssues} accent="warning" delay={0.05} />
        <StatisticsCard icon={CheckCircle2} label="Resolved Issues" value={data.stats.resolvedIssues} accent="success" delay={0.1} />
        <StatisticsCard icon={AlertOctagon} label="Critical Issues" value={data.stats.criticalIssues} accent="critical" delay={0.15} />
        <StatisticsCard icon={Clock} label="Avg. Resolution (days)" value={data.stats.avgResolutionDays} decimals={1} accent="primary" delay={0.2} />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <RevealOnScroll className="lg:col-span-2">
          <Card className="h-full">
            <CardHeader>
              <CardTitle>Monthly Reports vs. Resolutions</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <TrendAreaChart data={data.monthlyTrend} />
            </CardContent>
          </Card>
        </RevealOnScroll>

        <RevealOnScroll delay={0.1}>
          <Card className="h-full">
            <CardHeader>
              <CardTitle>Resolved vs. Active</CardTitle>
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
              <CardTitle>Reports by Category</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <CategoryBarChart data={data.byCategory} />
            </CardContent>
          </Card>
        </RevealOnScroll>

        <RevealOnScroll delay={0.1}>
          <Card className="h-full">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Reports by Area</span>
                <span className="flex items-center gap-1 text-xs font-normal text-muted-foreground">
                  <Users2 className="h-3.5 w-3.5" /> {data.stats.communityConfirmations.toLocaleString("en-IN")} total confirmations
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
            <CardTitle>Issue Heatmap</CardTitle>
            <Button href="/map" size="sm" variant="outline">
              Open full map
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
