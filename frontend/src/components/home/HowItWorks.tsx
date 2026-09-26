"use client";

import { motion } from "framer-motion";
import { Camera, CheckCircle2, ChevronRight, MapPinned, Sparkles } from "lucide-react";
import { SectionHeading } from "@/components/common/SectionHeading";
import { RevealOnScroll } from "@/components/common/RevealOnScroll";
import { useTranslation } from "@/i18n/I18nProvider";
import type { TranslationKey } from "@/i18n/translate";

const STEPS: { icon: typeof Camera; titleKey: TranslationKey; descriptionKey: TranslationKey }[] = [
  { icon: Camera, titleKey: "home.howItWorks.step1Title", descriptionKey: "home.howItWorks.step1Desc" },
  { icon: MapPinned, titleKey: "home.howItWorks.step2Title", descriptionKey: "home.howItWorks.step2Desc" },
  { icon: Sparkles, titleKey: "home.howItWorks.step3Title", descriptionKey: "home.howItWorks.step3Desc" },
  { icon: CheckCircle2, titleKey: "home.howItWorks.step4Title", descriptionKey: "home.howItWorks.step4Desc" },
];

export function HowItWorks() {
  const { t } = useTranslation();
  return (
    <section className="bg-muted/40 py-20 sm:py-28">
      <div className="container">
        <SectionHeading
          eyebrow={t("home.howItWorks.eyebrow")}
          title={t("home.howItWorks.title")}
          description={t("home.howItWorks.description")}
        />

        <div className="relative mt-14 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          <div className="absolute left-0 right-0 top-8 hidden h-px bg-gradient-to-r from-transparent via-border to-transparent lg:block" />
          {STEPS.map((step, index) => (
            <RevealOnScroll key={step.titleKey} delay={index * 0.12}>
              <div className="relative flex flex-col items-center text-center lg:items-start lg:text-left">
                <motion.div
                  whileHover={{ scale: 1.06, rotate: 3 }}
                  className="relative z-10 flex h-16 w-16 items-center justify-center rounded-2xl bg-white shadow-card ring-1 ring-border"
                >
                  <step.icon className="h-7 w-7 text-primary-600" />
                  <span className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-br from-primary-600 to-secondary-600 text-xs font-bold text-white">
                    {index + 1}
                  </span>
                </motion.div>
                <h3 className="mt-5 text-lg font-semibold text-foreground">{t(step.titleKey)}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{t(step.descriptionKey)}</p>
                {index < STEPS.length - 1 && (
                  <span className="absolute -right-4 top-6 z-10 hidden h-8 w-8 items-center justify-center rounded-full bg-muted/40 text-border lg:flex">
                    <ChevronRight className="h-4 w-4" />
                  </span>
                )}
              </div>
            </RevealOnScroll>
          ))}
        </div>
      </div>
    </section>
  );
}
