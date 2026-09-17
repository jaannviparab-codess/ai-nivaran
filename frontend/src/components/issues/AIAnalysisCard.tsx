"use client";

import { motion } from "framer-motion";
import { AlertOctagon, Bot, FlaskConical, Lightbulb, ShieldAlert } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { SeverityBadge } from "./SeverityBadge";
import { PriorityScoreGauge } from "./PriorityScoreGauge";
import { ISSUE_CATEGORIES } from "@/lib/types";
import type { AIAnalysis, PriorityScoreBreakdown } from "@/lib/types";

export function AIAnalysisCard({
  analysis,
  priority,
}: {
  analysis: AIAnalysis;
  priority?: PriorityScoreBreakdown | null;
}) {
  const categoryMeta = ISSUE_CATEGORIES.find((c) => c.value === analysis.detectedCategory);

  return (
    <Card className="overflow-hidden border-primary-100">
      <CardHeader className="flex-row items-center justify-between space-y-0 bg-gradient-to-r from-primary-50 to-cyan-50">
        <CardTitle className="flex items-center gap-2 text-base">
          <Bot className="h-5 w-5 text-primary-600" />
          AI Analysis Result
        </CardTitle>
        {analysis.isDemo && (
          <Badge variant="outline" className="gap-1 bg-white">
            <FlaskConical className="h-3 w-3" /> Demo Mode
          </Badge>
        )}
      </CardHeader>
      <CardContent className="grid gap-6 pt-6 sm:grid-cols-[1fr_auto]">
        <div className="space-y-4">
          <div>
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Detected Problem</p>
            <p className="text-xl font-bold text-foreground">{categoryMeta?.labelEn}</p>
            <p className="font-devanagari text-sm text-muted-foreground">{categoryMeta?.labelMr}</p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-1.5 text-sm">
              <span className="text-muted-foreground">Confidence:</span>
              <span className="font-semibold text-primary-700">{Math.round(analysis.confidence * 100)}%</span>
            </div>
            <SeverityBadge severity={analysis.severity} />
            <span className="inline-flex items-center gap-1 rounded-full bg-critical-50 px-2.5 py-1 text-xs font-medium text-critical-600">
              <ShieldAlert className="h-3 w-3" />
              Safety Risk: {analysis.safetyRisk}
            </span>
          </div>

          <p className="text-sm text-slate-600">{analysis.summary}</p>

          {analysis.possibleCauses.length > 0 && (
            <div className="space-y-1.5 rounded-xl bg-muted p-3">
              <p className="flex items-center gap-1.5 text-xs font-semibold text-slate-600">
                <Lightbulb className="h-3.5 w-3.5" /> Possible Root Cause
              </p>
              {analysis.possibleCauses.map((cause, i) => (
                <p key={i} className="text-xs text-muted-foreground">
                  {cause}
                </p>
              ))}
            </div>
          )}
        </div>

        {priority && (
          <div className="flex items-center justify-center border-t border-border pt-4 sm:border-l sm:border-t-0 sm:pl-6 sm:pt-0">
            <PriorityScoreGauge score={priority.score} />
          </div>
        )}
      </CardContent>
      <div className="flex items-start gap-2 border-t border-border bg-warning-50 px-6 py-3 text-xs text-warning-600">
        <AlertOctagon className="mt-0.5 h-3.5 w-3.5 shrink-0" />
        <p>This is an AI-generated estimate to help prioritize review — not an official government decision.</p>
      </div>
    </Card>
  );
}
