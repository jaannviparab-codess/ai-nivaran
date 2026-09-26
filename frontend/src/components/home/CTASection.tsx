"use client";

import { ArrowRight, MapPin } from "lucide-react";
import { RevealOnScroll } from "@/components/common/RevealOnScroll";
import { Button } from "@/components/ui/Button";
import { useTranslation } from "@/i18n/I18nProvider";

export function CTASection() {
  const { t } = useTranslation();
  return (
    <section className="py-20 sm:py-28">
      <div className="container">
        <RevealOnScroll>
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary-700 via-secondary-600 to-cyan-500 px-6 py-16 text-center shadow-glow sm:px-16">
            <div className="absolute inset-0 bg-grid opacity-20 [mask-image:radial-gradient(ellipse_60%_60%_at_50%_50%,black,transparent)]" />
            <div className="relative">
              <p className="font-devanagari text-2xl text-white/90">{t("home.cta.kicker")}</p>
              <h2 className="mt-2 text-3xl font-bold tracking-tight text-white sm:text-4xl">
                {t("home.cta.title")}
              </h2>
              <p className="mx-auto mt-4 max-w-xl text-white/85">
                {t("home.cta.description")}
              </p>
              <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
                <Button href="/report" size="lg" variant="glass" className="text-primary-700" rightIcon={<ArrowRight className="h-4 w-4" />}>
                  {t("home.cta.report")}
                </Button>
                <Button
                  href="/map"
                  size="lg"
                  variant="outline"
                  className="border-white/40 bg-transparent text-white hover:bg-white/10"
                  leftIcon={<MapPin className="h-4 w-4" />}
                >
                  {t("home.cta.explore")}
                </Button>
              </div>
            </div>
          </div>
        </RevealOnScroll>
      </div>
    </section>
  );
}
