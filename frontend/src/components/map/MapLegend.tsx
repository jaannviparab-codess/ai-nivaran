"use client";

import { MARKER_COLORS } from "./markerColors";
import { useTranslation } from "@/i18n/I18nProvider";

const ITEMS: (keyof typeof MARKER_COLORS)[] = ["critical", "high", "normal", "resolved"];

export function MapLegend({ className }: { className?: string }) {
  const { t } = useTranslation();
  return (
    <div className={className}>
      {ITEMS.map((key) => (
        <span key={key} className="flex items-center gap-1.5 text-xs font-medium text-slate-600">
          <span className="h-2.5 w-2.5 rounded-full border border-white shadow-sm" style={{ backgroundColor: MARKER_COLORS[key] }} />
          {t(`map.legend.${key}`)}
        </span>
      ))}
    </div>
  );
}
