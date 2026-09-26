"use client";

import { motion } from "framer-motion";
import { useReducedMotion } from "@/lib/hooks/useReducedMotion";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/i18n/I18nProvider";

function bandFor(score: number) {
  if (score >= 80) return { color: "#dc2626", key: "critical" } as const;
  if (score >= 60) return { color: "#d97706", key: "high" } as const;
  if (score >= 35) return { color: "#4f46e5", key: "medium" } as const;
  return { color: "#64748b", key: "low" } as const;
}

export function PriorityScoreGauge({ score, size = 112 }: { score: number; size?: number }) {
  const reducedMotion = useReducedMotion();
  const { t } = useTranslation();
  const band = bandFor(score);
  const radius = (size - 12) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - score / 100);

  return (
    <div className="flex flex-col items-center gap-2" style={{ width: size }}>
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90">
          <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="hsl(var(--muted))" strokeWidth={9} />
          <motion.circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={band.color}
            strokeWidth={9}
            strokeLinecap="round"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset: reducedMotion ? offset : offset }}
            transition={{ duration: reducedMotion ? 0 : 1.2, ease: "easeOut" }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-bold text-foreground">{score}</span>
          <span className="text-[10px] text-muted-foreground">{t("priority.outOf")}</span>
        </div>
      </div>
      <span className={cn("text-center text-xs font-semibold")} style={{ color: band.color }}>
        {t(`priorityBand.${band.key}`)}
      </span>
    </div>
  );
}
