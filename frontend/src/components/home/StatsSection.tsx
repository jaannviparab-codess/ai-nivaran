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
import { useTranslation } from "@/i18n/I18nProvider";

export function StatsSection() {
  const [data, setData] = useState<AnalyticsSnapshot | null>(null);
  const { t } = useTranslation();

  useEffect(() => {
    getAnalytics().then(setData);
  }, []);

  const stats = data?.stats;

  return (
    <section className="py-20 sm:py-28">
      <div className="container">
        <SectionHeading
          eyebrow={t("home.stats.eyebrow")}
          title={t("home.stats.title")}
          description={t("home.stats.description")}
        />
        {DEMO_MODE && (
          <p className="mx-auto mt-4 flex max-w-md items-center justify-center gap-1.5 text-center text-xs font-medium text-muted-foreground">
            <FlaskConical className="h-3.5 w-3.5 shrink-0 text-primary-500" /> {t("stats.demoNotice")}
          </p>
        )}

        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          <StatisticsCard icon={FileStack} label={t("stats.totalReports")} value={stats?.totalReports ?? 0} suffix="+" accent="primary" delay={0} />
          <StatisticsCard icon={ListChecks} label={t("stats.activeIssues")} value={stats?.activeIssues ?? 0} accent="warning" delay={0.06} />
          <StatisticsCard icon={CheckCircle2} label={t("stats.resolvedIssues")} value={stats?.resolvedIssues ?? 0} accent="success" delay={0.12} />
          <StatisticsCard icon={AlertOctagon} label={t("stats.criticalIssues")} value={stats?.criticalIssues ?? 0} accent="critical" delay={0.18} />
          <StatisticsCard icon={Clock} label={t("stats.avgResolution")} value={stats?.avgResolutionDays ?? 0} decimals={1} accent="primary" delay={0.24} />
          <StatisticsCard icon={Activity} label={t("home.stats.automatedMonitoring")} value={24} suffix="/7" accent="success" delay={0.3} />
        </div>

        {data && (
          <RevealOnScroll delay={0.2} className="mt-8 rounded-2xl border border-border bg-white p-6 shadow-card">
            <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
              <h3 className="text-sm font-semibold text-foreground">{t("home.stats.monthlyChart")}</h3>
              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                <span className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-primary-600" /> {t("charts.reported")}
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-success-600" /> {t("charts.resolved")}
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
