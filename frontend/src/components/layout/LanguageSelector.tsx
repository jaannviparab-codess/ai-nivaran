"use client";

import { ChevronDown, Globe } from "lucide-react";
import { useId } from "react";
import { LANGUAGE_OPTIONS, isLocale } from "@/i18n/config";
import { useTranslation } from "@/i18n/I18nProvider";
import { cn } from "@/lib/utils";

/**
 * Global UI-language picker. A native <select> is used on purpose: it gives
 * full keyboard support, screen-reader semantics and the platform's own
 * picker on mobile for free. Options are always shown in their own script
 * (English / हिंदी / मराठी) so users can find their language from any UI language.
 */
export function LanguageSelector({
  variant = "compact",
  className,
}: {
  /** compact: icon + select for the navbar; full: visible label above a full-width select (mobile menu). */
  variant?: "compact" | "full";
  className?: string;
}) {
  const { locale, setLocale, t } = useTranslation();
  const id = useId();

  return (
    <div className={cn(variant === "full" ? "space-y-1.5" : "relative", className)}>
      <label
        htmlFor={id}
        className={variant === "full" ? "flex items-center gap-1.5 text-xs font-medium text-slate-600" : "sr-only"}
      >
        {variant === "full" && <Globe className="h-3.5 w-3.5" aria-hidden="true" />}
        {t("language.selectLabel")}
      </label>
      <div className="relative">
        {variant === "compact" && (
          <Globe
            className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500"
            aria-hidden="true"
          />
        )}
        <select
          id={id}
          value={locale}
          onChange={(e) => {
            if (isLocale(e.target.value)) setLocale(e.target.value);
          }}
          className={cn(
            "w-full cursor-pointer appearance-none rounded-lg border border-border bg-white text-sm font-medium text-foreground transition-colors",
            "hover:bg-muted/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500",
            variant === "compact" ? "h-9 pl-8 pr-7" : "h-10 px-3 pr-8"
          )}
        >
          {LANGUAGE_OPTIONS.map((option) => (
            <option key={option.code} value={option.code} lang={option.code}>
              {option.nativeName}
            </option>
          ))}
        </select>
        <ChevronDown
          className="pointer-events-none absolute right-2 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500"
          aria-hidden="true"
        />
      </div>
    </div>
  );
}
