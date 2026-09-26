"use client";

import { FlaskConical, X } from "lucide-react";
import { useState } from "react";
import { DEMO_MODE } from "@/lib/constants";
import { useTranslation } from "@/i18n/I18nProvider";

export function DemoModeBanner() {
  const [dismissed, setDismissed] = useState(false);
  const { t } = useTranslation();
  if (!DEMO_MODE || dismissed) return null;

  return (
    <div className="relative flex items-center justify-center gap-2 bg-slate-900 px-4 py-2 text-center text-xs font-medium text-white sm:text-sm">
      <FlaskConical className="h-3.5 w-3.5 shrink-0 text-cyan-400" />
      <p className="pr-6">{t("demoBanner.message")}</p>
      <button
        onClick={() => setDismissed(true)}
        aria-label={t("demoBanner.dismiss")}
        className="absolute right-3 rounded-md p-1 hover:bg-white/10"
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}
