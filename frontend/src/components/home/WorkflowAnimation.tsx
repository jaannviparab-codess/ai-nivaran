"use client";

import { motion } from "framer-motion";
import { Bot, CheckCircle2, ClipboardList, Gauge, ShieldCheck, Sparkles, UserCheck, Wrench } from "lucide-react";
import { useRef } from "react";
import { useInView } from "framer-motion";
import { SectionHeading } from "@/components/common/SectionHeading";
import { RevealOnScroll } from "@/components/common/RevealOnScroll";
import { useReducedMotion } from "@/lib/hooks/useReducedMotion";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/i18n/I18nProvider";
import type { TranslationKey } from "@/i18n/translate";

const NODES: { icon: typeof Bot; key: string; ai: boolean }[] = [
  { icon: ClipboardList, key: "report", ai: false },
  { icon: Bot, key: "detection", ai: true },
  { icon: ShieldCheck, key: "verification", ai: true },
  { icon: Gauge, key: "priority", ai: true },
  { icon: Wrench, key: "authority", ai: false },
  { icon: UserCheck, key: "citizen", ai: false },
  { icon: CheckCircle2, key: "resolved", ai: false },
];

export function WorkflowAnimation() {
  const containerRef = useRef<HTMLDivElement>(null);
  const inView = useInView(containerRef, { once: true, margin: "-100px" });
  const reducedMotion = useReducedMotion();
  const { t } = useTranslation();

  return (
    <section className="py-20 sm:py-28">
      <div className="container">
        <SectionHeading
          eyebrow={t("home.pipeline.eyebrow")}
          title={t("home.pipeline.title")}
          description={t("home.pipeline.description")}
        />

        <div ref={containerRef} className="relative mt-16">
          {/* desktop horizontal line */}
          <div className="absolute left-0 right-0 top-7 hidden h-1 rounded-full bg-border lg:block" />
          <motion.div
            className="absolute left-0 top-7 hidden h-1 rounded-full bg-gradient-to-r from-primary-600 via-cyan-500 to-success-500 lg:block"
            initial={{ width: "0%" }}
            animate={{ width: inView ? "100%" : "0%" }}
            transition={{ duration: 1.6, ease: "easeInOut" }}
          />
          {inView && !reducedMotion && (
            <motion.span
              className="absolute top-6 hidden h-2 w-2 rounded-full bg-white shadow-glow ring-2 ring-cyan-400 lg:block"
              initial={{ left: "0%", opacity: 0 }}
              animate={{ left: ["0%", "100%"], opacity: [0, 1, 1, 0] }}
              transition={{ duration: 3, delay: 1.6, repeat: Infinity, repeatDelay: 1, ease: "linear" }}
            />
          )}

          <div className="relative grid gap-8 lg:grid-cols-7 lg:gap-4">
            {NODES.map((node, index) => (
              <RevealOnScroll key={node.key} delay={index * 0.15} direction="up">
                <div className="flex items-start gap-4 lg:flex-col lg:items-center lg:text-center">
                  <motion.div
                    initial={{ scale: 0.6 }}
                    animate={inView ? { scale: 1 } : {}}
                    whileHover={{ scale: 1.08 }}
                    transition={{ duration: 0.4, delay: reducedMotion ? 0 : index * 0.15 + 0.2, type: "spring", stiffness: 200 }}
                    className={cn(
                      "relative z-10 flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white shadow-card ring-1 transition-shadow duration-300 hover:shadow-glow",
                      node.ai ? "ring-primary-200" : "ring-border"
                    )}
                  >
                    <node.icon className="h-6 w-6 text-primary-600" />
                    {node.ai && (
                      <span className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-gradient-to-br from-primary-600 to-secondary-600 text-white shadow-soft">
                        <Sparkles className="h-2.5 w-2.5" />
                      </span>
                    )}
                  </motion.div>
                  <div className="lg:mt-1">
                    <p className="text-sm font-semibold text-foreground">{t(`home.pipeline.${node.key}Title` as TranslationKey)}</p>
                    <p className="mt-0.5 text-xs text-muted-foreground lg:max-w-[120px]">{t(`home.pipeline.${node.key}Desc` as TranslationKey)}</p>
                  </div>
                </div>
              </RevealOnScroll>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
