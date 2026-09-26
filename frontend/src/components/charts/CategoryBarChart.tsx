"use client";

import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { CategoryBreakdown } from "@/lib/types";
import { useTranslation } from "@/i18n/I18nProvider";

const COLORS = ["#4f46e5", "#7c3aed", "#06b6d4", "#d97706", "#dc2626", "#059669", "#a78bfa", "#0d9488", "#f59e0b", "#65a30d"];

export function CategoryBarChart({ data }: { data: CategoryBreakdown[] }) {
  const { t, tOptional } = useTranslation();
  const chartData = data
    .map((d) => ({ name: tOptional(`category.${d.category}`, d.category), count: d.count }))
    .sort((a, b) => b.count - a.count);

  return (
    <ResponsiveContainer width="100%" height={340}>
      <BarChart data={chartData} layout="vertical" margin={{ left: 20, right: 20 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" horizontal={false} />
        <XAxis type="number" tickLine={false} axisLine={false} tick={{ fontSize: 12, fill: "#64748b" }} />
        <YAxis type="category" dataKey="name" tickLine={false} axisLine={false} width={130} tick={{ fontSize: 12, fill: "#334155" }} />
        <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid #e2e8f0", fontSize: 13 }} cursor={{ fill: "#f1f5f9" }} />
        <Bar dataKey="count" name={t("charts.reports")} radius={[0, 6, 6, 0]} animationDuration={1000}>
          {chartData.map((_, index) => (
            <Cell key={index} fill={COLORS[index % COLORS.length]} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
