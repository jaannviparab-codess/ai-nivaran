import { AlertTriangle } from "lucide-react";
import { SEVERITY_META } from "@/lib/constants";
import type { IssueSeverity } from "@/lib/types";
import { cn } from "@/lib/utils";

export function SeverityBadge({ severity, className }: { severity: IssueSeverity; className?: string }) {
  const meta = SEVERITY_META[severity];
  return (
    <span className={cn("inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium transition-transform duration-150 hover:scale-105", meta.bg, meta.text, className)}>
      <AlertTriangle className="h-3 w-3" />
      {meta.label}
    </span>
  );
}
