"use client";

import Link from "next/link";
import { CheckCircle2, MapPin, ShieldCheck, Sparkles, Trash2, Wrench } from "lucide-react";
import { LanguageSelector } from "@/components/layout/LanguageSelector";
import { useTranslation } from "@/i18n/I18nProvider";
import type { TranslationKey } from "@/i18n/translate";

const POINTS: TranslationKey[] = ["auth.point1", "auth.point2", "auth.point3"];

export function AuthLayout({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  const { t } = useTranslation();
  return (
    <div className="container grid min-h-[calc(100vh-5rem)] items-center gap-8 py-8 lg:grid-cols-2 lg:gap-10 lg:py-10">
      <div className="animate-fade-in-up">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary-700 via-secondary-600 to-cyan-500 p-6 text-white shadow-glow sm:p-8 lg:p-10">
          <div className="absolute inset-0 bg-grid opacity-20 [mask-image:radial-gradient(ellipse_70%_70%_at_30%_20%,black,transparent)]" />

          {/* Compact AI/civic visualization — decorative, purely transform/opacity animation */}
          <div aria-hidden="true" className="pointer-events-none absolute -right-4 -top-4 h-32 w-32 sm:h-40 sm:w-40">
            <div className="absolute inset-0 overflow-hidden rounded-full">
              <div className="absolute inset-x-0 h-10 animate-scan-line bg-gradient-to-b from-transparent via-white/20 to-transparent" />
            </div>
            <span className="absolute inset-4 rounded-full border border-dashed border-white/30 animate-orb-spin" />
            <span className="absolute inset-8 rounded-full border border-white/20 animate-radar" />
            <div className="absolute inset-[34%] flex items-center justify-center rounded-full bg-white/20 backdrop-blur-sm">
              <Sparkles className="h-5 w-5 text-white" />
            </div>
            <span className="absolute left-0 top-2 flex h-7 w-7 animate-float-slow items-center justify-center rounded-lg bg-white/15 [animation-delay:0.4s]">
              <Wrench className="h-3.5 w-3.5" />
            </span>
            <span className="absolute bottom-1 right-6 flex h-7 w-7 animate-float-slow items-center justify-center rounded-lg bg-white/15 [animation-delay:1.2s]">
              <Trash2 className="h-3.5 w-3.5" />
            </span>
            <span className="absolute bottom-6 left-2 flex h-6 w-6 animate-float-slow items-center justify-center rounded-lg bg-white/15 [animation-delay:0.8s]">
              <MapPin className="h-3 w-3" />
            </span>
          </div>

          <div className="relative">
            <Link href="/" className="flex items-center gap-2.5 font-bold">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/15">
                <span className="font-devanagari text-lg leading-normal">नि</span>
              </span>
              <span className="font-devanagari text-base">निवारण AI</span>
            </Link>
            <h2 className="mt-6 text-2xl font-bold leading-tight sm:mt-8 sm:text-3xl">
              {t("auth.heroTitle")}
            </h2>
            <p className="mt-3 max-w-xs text-sm text-white/85 lg:hidden">
              {t("auth.heroSubtitle")}
            </p>
            <ul className="mt-8 hidden space-y-4 lg:block">
              {POINTS.map((point, i) => (
                <li
                  key={point}
                  style={{ animationDelay: `${0.3 + i * 0.1}s` }}
                  className="flex animate-fade-in-up items-start gap-3 text-sm text-white/90"
                >
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" /> {t(point)}
                </li>
              ))}
            </ul>
            <div className="mt-8 hidden items-center gap-2 rounded-xl bg-white/10 p-3 text-xs text-white/80 lg:flex">
              <ShieldCheck className="h-4 w-4 shrink-0" /> {t("auth.passwordsHashed")}
            </div>
          </div>
        </div>
      </div>

      <div style={{ animationDelay: "0.1s" }} className="mx-auto w-full max-w-sm animate-fade-in-up">
        <div className="mb-6 flex justify-end">
          <LanguageSelector className="w-[7.5rem]" />
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">{title}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>
        <div className="mt-8">{children}</div>
      </div>
    </div>
  );
}
