"use client";

import { Activity, AlertOctagon, CheckCircle2, Clock, FileStack, FlaskConical, ListChecks } from "lucide-react";
import { useEffect, useState } from "react";
import { SectionHeading } from "@/components/common/SectionHeading";
import { RevealOnScroll } from "@/components/common/RevealOnScroll";
import { StatisticsCard } from "@/components/charts/StatisticsCard";
import { TrendAreaChart } from "@/components/charts/TrendAreaChart";
import { DEMO_MODE } from "@/lib/constants";
import { getAnalytics } from "@/lib/api";
import type { AnalyticsSnapshot } from "@/lib/types";

export function StatsSection() {
  const [data, setData] = useState<AnalyticsSnapshot | null>(null);

  useEffect(() => {
    getAnalytics().then(setData);
  }, []);

  const stats = data?.stats;

  return (
    <section className="py-20 sm:py-28">
      <div className="container">
        <SectionHeading
          eyebrow="Public Impact"
          title="Real numbers, updated continuously"
          description="Transparency is the point — every statistic below reflects the same data citizens see on the analytics dashboard."
        />
        {DEMO_MODE && (
          <p className="mx-auto mt-4 flex max-w-md items-center justify-center gap-1.5 text-center text-xs font-medium text-muted-foreground">
            <FlaskConical className="h-3.5 w-3.5 text-primary-500" /> Demo/sample statistics for this showcase build —
            not live production figures.
          </p>
        )}

        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          <StatisticsCard icon={FileStack} label="Total Reports" value={stats?.totalReports ?? 0} suffix="+" accent="primary" delay={0} />
          <StatisticsCard icon={ListChecks} label="Active Issues" value={stats?.activeIssues ?? 0} accent="warning" delay={0.06} />
          <StatisticsCard icon={CheckCircle2} label="Resolved Issues" value={stats?.resolvedIssues ?? 0} accent="success" delay={0.12} />
          <StatisticsCard icon={AlertOctagon} label="Critical Issues" value={stats?.criticalIssues ?? 0} accent="critical" delay={0.18} />
          <StatisticsCard icon={Clock} label="Avg. Resolution (days)" value={stats?.avgResolutionDays ?? 0} decimals={1} accent="primary" delay={0.24} />
          <StatisticsCard icon={Activity} label="Automated Monitoring" value={24} suffix="/7" accent="success" delay={0.3} />
        </div>

        {data && (
          <RevealOnScroll delay={0.2} className="mt-8 rounded-2xl border border-border bg-white p-6 shadow-card">
            <div className="mb-2 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-foreground">Monthly reports vs. resolutions</h3>
              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                <span className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-primary-600" /> Reported
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-success-600" /> Resolved
                </span>
              </div>
            </div>
            <TrendAreaChart data={data.monthlyTrend} />
          </RevealOnScroll>
        )}
      </div>
    </section>
  );
}
