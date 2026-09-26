"use client";

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { useTranslation } from "@/i18n/I18nProvider";

export function ResolvedDonutChart({ resolved, active }: { resolved: number; active: number }) {
  const { t } = useTranslation();
  const data = [
    { name: t("charts.resolved"), value: resolved, color: "#059669" },
    { name: t("charts.active"), value: active, color: "#d97706" },
  ];
  const total = resolved + active;
  const pct = total > 0 ? Math.round((resolved / total) * 100) : 0;

  return (
    <div className="relative">
      <ResponsiveContainer width="100%" height={240}>
        <PieChart>
          <Pie data={data} dataKey="value" nameKey="name" innerRadius={70} outerRadius={95} paddingAngle={3} animationDuration={1000}>
            {data.map((entry) => (
              <Cell key={entry.name} fill={entry.color} stroke="white" strokeWidth={2} />
            ))}
          </Pie>
          <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid #e2e8f0", fontSize: 13 }} />
        </PieChart>
      </ResponsiveContainer>
      <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-2xl font-bold text-foreground">{pct}%</span>
        <span className="text-xs text-muted-foreground">{t("charts.resolved")}</span>
      </div>
      <div className="mt-2 flex justify-center gap-4 text-xs">
        <span className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-success-600" /> {t("charts.legendCount", { label: t("charts.resolved"), count: resolved })}
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-warning-500" /> {t("charts.legendCount", { label: t("charts.active"), count: active })}
        </span>
      </div>
    </div>
  );
}
