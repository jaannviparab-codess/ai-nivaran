"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { SectionHeading } from "@/components/common/SectionHeading";
import { RevealOnScroll } from "@/components/common/RevealOnScroll";
import { BeforeAfterSlider } from "@/components/issues/BeforeAfterSlider";
import { MOCK_ISSUES } from "@/lib/mock-data";
import { useTranslation } from "@/i18n/I18nProvider";

export function BeforeAfterShowcase() {
  const { t, formatDate } = useTranslation();
  const resolved = MOCK_ISSUES.filter((i) => i.resolution).slice(0, 3);
  if (resolved.length === 0) return null;

  return (
    <section className="bg-muted/40 py-20 sm:py-28">
      <div className="container">
        <SectionHeading
          eyebrow={t("home.beforeAfter.eyebrow")}
          title={t("home.beforeAfter.title")}
          description={t("home.beforeAfter.description")}
        />

        <div className="mt-14 grid gap-8 lg:grid-cols-3">
          {resolved.map((issue, index) => {
            return (
              <RevealOnScroll key={issue.id} delay={index * 0.12}>
                <div className="overflow-hidden rounded-2xl border border-border bg-white shadow-card">
                  <BeforeAfterSlider beforeUrl={issue.resolution!.beforeImageUrl!} afterUrl={issue.resolution!.afterImageUrl!} />
                  <div className="p-4">
                    <p className="text-xs font-medium uppercase tracking-wide text-primary-600">{t(`category.${issue.category}`)}</p>
                    <p className="mt-1 text-sm font-semibold text-foreground">{issue.title}</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {t("home.beforeAfter.resolvedOn", { date: formatDate(issue.resolution!.resolvedAt), ward: issue.location.ward ?? "" })}
                    </p>
                    <Link
                      href={`/issues/${issue.id}`}
                      className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-primary-700 hover:underline"
                    >
                      {t("home.beforeAfter.viewTimeline")} <ArrowRight className="h-3 w-3" />
                    </Link>
                  </div>
                </div>
              </RevealOnScroll>
            );
          })}
        </div>
      </div>
    </section>
  );
}
