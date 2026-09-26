"use client";

import Link from "next/link";
import { ArrowRight, Flame, Sparkles, TrendingUp, Users } from "lucide-react";
import { SectionHeading } from "@/components/common/SectionHeading";
import { RevealOnScroll } from "@/components/common/RevealOnScroll";
import { Button } from "@/components/ui/Button";
import { MOCK_ISSUES, MOCK_ANALYTICS } from "@/lib/mock-data";
import { SeverityBadge } from "@/components/issues/SeverityBadge";
import { useTranslation } from "@/i18n/I18nProvider";

export function CommunitySection() {
  const { t } = useTranslation();
  const trending = [...MOCK_ISSUES].sort((a, b) => b.confirmations.total - a.confirmations.total).slice(0, 4);
  const topArea = MOCK_ANALYTICS.byArea[0];

  return (
    <section className="py-20 sm:py-28">
      <div className="container">
        <SectionHeading
          eyebrow={t("home.community.eyebrow")}
          title={t("home.community.title")}
          description={t("home.community.description")}
        />

        <div className="mt-14 grid gap-6 lg:grid-cols-5">
          <RevealOnScroll className="lg:col-span-3">
            <div className="h-full rounded-2xl border border-border bg-white p-6 shadow-card">
              <h3 className="flex items-center gap-2 text-sm font-semibold text-foreground">
                <Flame className="h-4 w-4 text-warning-500" /> {t("home.community.trending")}
              </h3>
              <div className="mt-4 space-y-3">
                {trending.map((issue) => {
                  return (
                    <Link
                      key={issue.id}
                      href={`/issues/${issue.id}`}
                      className="flex items-center justify-between gap-3 rounded-xl p-2.5 transition-colors hover:bg-muted"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-foreground">{issue.title}</p>
                        <p className="text-xs text-muted-foreground">
                          {t(`category.${issue.category}`)} · {issue.location.ward}
                        </p>
                      </div>
                      <div className="flex shrink-0 items-center gap-3">
                        <SeverityBadge severity={issue.severity} />
                        <span className="flex items-center gap-1 text-xs font-semibold text-slate-500">
                          <Users className="h-3.5 w-3.5" /> {issue.confirmations.total}
                        </span>
                      </div>
                    </Link>
                  );
                })}
              </div>
              <Button href="/community" variant="ghost" size="sm" className="mt-4" rightIcon={<ArrowRight className="h-3.5 w-3.5" />}>
                {t("home.community.viewHub")}
              </Button>
            </div>
          </RevealOnScroll>

          <RevealOnScroll delay={0.15} className="lg:col-span-2">
            <div className="flex h-full flex-col justify-between rounded-2xl bg-gradient-to-br from-primary-600 to-secondary-600 p-6 text-white shadow-glow">
              <div>
                <h3 className="flex items-center gap-2 text-sm font-semibold">
                  <Sparkles className="h-4 w-4" /> {t("home.community.insightTitle")}
                </h3>
                <p className="mt-4 text-lg font-semibold leading-snug">
                  {t("home.community.insightQuote", { ward: topArea.ward })}
                </p>
                <p className="mt-3 flex items-center gap-1.5 text-sm text-white/85">
                  <TrendingUp className="h-4 w-4 shrink-0" />{" "}
                  {t("home.community.insightDetail", { count: topArea.count, resolved: topArea.resolvedCount })}
                </p>
              </div>
              <p className="mt-6 text-xs text-white/70">
                {t("home.community.insightDisclaimer")}
              </p>
            </div>
          </RevealOnScroll>
        </div>
      </div>
    </section>
  );
}
