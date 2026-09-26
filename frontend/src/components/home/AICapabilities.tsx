"use client";

import {
  Bot,
  Copy,
  Eye,
  Gauge,
  Lightbulb,
  Mic,
  MessageSquareText,
  ScanSearch,
  ShieldAlert,
  Sparkles,
  Users2,
} from "lucide-react";
import { SectionHeading } from "@/components/common/SectionHeading";
import { RevealOnScroll } from "@/components/common/RevealOnScroll";
import { useTranslation } from "@/i18n/I18nProvider";
import type { TranslationKey } from "@/i18n/translate";

// Each key maps to home.capabilities.<key>Title / <key>Desc.
const CAPABILITIES: { icon: typeof Bot; key: string }[] = [
  { icon: ScanSearch, key: "imageClassification" },
  { icon: Eye, key: "imageUnderstanding" },
  { icon: Gauge, key: "severity" },
  { icon: Copy, key: "duplicate" },
  { icon: ShieldAlert, key: "spam" },
  { icon: Sparkles, key: "priority" },
  { icon: MessageSquareText, key: "nlp" },
  { icon: Mic, key: "voice" },
  { icon: Bot, key: "assistant" },
  { icon: Lightbulb, key: "rootCause" },
  { icon: Users2, key: "community" },
];

export function AICapabilities() {
  const { t } = useTranslation();
  return (
    <section className="bg-gradient-to-b from-white to-primary-50/40 py-20 sm:py-28">
      <div className="container">
        <SectionHeading
          eyebrow={t("home.capabilities.eyebrow")}
          title={t("home.capabilities.title")}
          description={t("home.capabilities.description")}
        />

        <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {CAPABILITIES.map((cap, index) => (
            <RevealOnScroll key={cap.key} delay={Math.min(index * 0.06, 0.4)}>
              <div className="group relative h-full overflow-hidden rounded-2xl border border-border bg-white p-5 shadow-card transition-all duration-300 hover:-translate-y-1 hover:shadow-glow">
                <span className="absolute right-3.5 top-3.5 flex items-center gap-1 rounded-full bg-muted px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-muted-foreground opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                  <span className="relative flex h-1.5 w-1.5">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-cyan-400 opacity-75" />
                    <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-cyan-500" />
                  </span>
                  {t("home.capabilities.aiActive")}
                </span>
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-primary-50 to-secondary-50 text-primary-600 transition-all duration-300 group-hover:scale-110 group-hover:from-primary-600 group-hover:to-secondary-600 group-hover:text-white">
                  <cap.icon className="h-5 w-5" />
                </div>
                <h3 className="mt-4 text-sm font-semibold text-foreground">{t(`home.capabilities.${cap.key}Title` as TranslationKey)}</h3>
                <p className="mt-1.5 text-sm text-muted-foreground">{t(`home.capabilities.${cap.key}Desc` as TranslationKey)}</p>
              </div>
            </RevealOnScroll>
          ))}
        </div>
      </div>
    </section>
  );
}
