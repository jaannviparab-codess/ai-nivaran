"use client";

import { GripVertical } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/i18n/I18nProvider";

export function BeforeAfterSlider({
  beforeUrl,
  afterUrl,
  beforeLabel: beforeLabelProp,
  afterLabel: afterLabelProp,
  className,
}: {
  beforeUrl: string;
  afterUrl: string;
  beforeLabel?: string;
  afterLabel?: string;
  className?: string;
}) {
  const [position, setPosition] = useState(50);
  const { t } = useTranslation();
  const beforeLabel = beforeLabelProp ?? t("common.before");
  const afterLabel = afterLabelProp ?? t("common.after");

  return (
    <div className={cn("relative aspect-[4/3] w-full select-none overflow-hidden rounded-2xl bg-muted sm:aspect-video", className)}>
      <img src={afterUrl} alt={afterLabel} className="absolute inset-0 h-full w-full object-cover" draggable={false} />
      <div className="absolute inset-0" style={{ clipPath: `inset(0 ${100 - position}% 0 0)` }}>
        <img src={beforeUrl} alt={beforeLabel} className="absolute inset-0 h-full w-full object-cover" draggable={false} />
      </div>

      <span className="absolute left-3 top-3 rounded-full bg-slate-900/70 px-2.5 py-1 text-xs font-medium text-white">
        {beforeLabel}
      </span>
      <span className="absolute right-3 top-3 rounded-full bg-success-600/90 px-2.5 py-1 text-xs font-medium text-white">
        {afterLabel}
      </span>

      <div className="pointer-events-none absolute inset-y-0 w-0.5 bg-white shadow-[0_0_0_1px_rgba(0,0,0,0.1)]" style={{ left: `${position}%` }}>
        <div className="pointer-events-none absolute left-1/2 top-1/2 flex h-9 w-9 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-white shadow-card">
          <GripVertical className="h-4 w-4 text-slate-500" />
        </div>
      </div>

      <input
        type="range"
        min={0}
        max={100}
        value={position}
        onChange={(e) => setPosition(Number(e.target.value))}
        aria-label={t("common.comparisonSlider", { before: beforeLabel, after: afterLabel })}
        className="absolute inset-0 h-full w-full cursor-ew-resize opacity-0"
      />
    </div>
  );
}
