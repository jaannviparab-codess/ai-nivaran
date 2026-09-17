"use client";

import { motion } from "framer-motion";
import { Info } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { PriorityScoreGauge } from "./PriorityScoreGauge";
import type { PriorityScoreBreakdown } from "@/lib/types";

export function PriorityScoreBreakdownCard({ breakdown }: { breakdown: PriorityScoreBreakdown }) {
  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between space-y-0">
        <CardTitle>Priority Score</CardTitle>
        <span className="flex items-center gap-1 text-xs text-muted-foreground">
          <Info className="h-3.5 w-3.5" /> AI estimate
        </span>
      </CardHeader>
      <CardContent className="flex flex-col gap-6 sm:flex-row sm:items-center">
        <div className="flex justify-center sm:justify-start">
          <PriorityScoreGauge score={breakdown.score} />
        </div>
        <div className="flex-1 space-y-3">
          <p className="text-sm font-medium text-foreground">Why this score?</p>
          {breakdown.factors.map((factor, i) => (
            <div key={factor.label}>
              <div className="mb-1 flex items-center justify-between text-xs">
                <span className="font-medium text-slate-700">{factor.label}</span>
                <span className="text-muted-foreground">{factor.detail}</span>
              </div>
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                <motion.div
                  initial={{ width: 0 }}
                  whileInView={{ width: `${Math.min(100, (factor.contribution / (factor.weight * 100)) * 100)}%` }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.8, delay: i * 0.1, ease: "easeOut" }}
                  className="h-full rounded-full bg-gradient-to-r from-primary-600 to-secondary-600"
                />
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
