"use client";

import { Check, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/i18n/I18nProvider";
import type { TranslationKey } from "@/i18n/translate";

const RULES: { labelKey: TranslationKey; test: (v: string) => boolean }[] = [
  { labelKey: "auth.strength.minLength", test: (v: string) => v.length >= 8 },
  { labelKey: "auth.strength.uppercase", test: (v: string) => /[A-Z]/.test(v) },
  { labelKey: "auth.strength.number", test: (v: string) => /[0-9]/.test(v) },
];

export function passwordMeetsRequirements(value: string): boolean {
  return RULES.every((rule) => rule.test(value));
}

export function PasswordStrength({ password }: { password: string }) {
  const { t } = useTranslation();
  const passedCount = RULES.filter((rule) => rule.test(password)).length;
  const strength = password.length === 0 ? 0 : passedCount;

  const strengthMeta = [
    { label: "", color: "bg-border" },
    { label: t("auth.strength.weak"), color: "bg-critical-500" },
    { label: t("auth.strength.fair"), color: "bg-warning-500" },
    { label: t("auth.strength.strong"), color: "bg-success-500" },
  ][strength];

  return (
    <div className="mt-2 space-y-2">
      <div className="flex gap-1.5">
        {RULES.map((_, i) => (
          <span
            key={i}
            className={cn("h-1.5 flex-1 rounded-full transition-colors duration-300", i < strength ? strengthMeta.color : "bg-border")}
          />
        ))}
      </div>
      {password.length > 0 && strengthMeta.label && (
        <p className="text-xs font-medium text-muted-foreground">{t("auth.strength.label", { level: strengthMeta.label })}</p>
      )}
      <ul className="space-y-1">
        {RULES.map((rule) => {
          const passed = rule.test(password);
          return (
            <li key={rule.labelKey} className={cn("flex items-center gap-1.5 text-xs", passed ? "text-success-600" : "text-muted-foreground")}>
              {passed ? <Check className="h-3.5 w-3.5" /> : <X className="h-3.5 w-3.5 text-border" />}
              {t(rule.labelKey)}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
