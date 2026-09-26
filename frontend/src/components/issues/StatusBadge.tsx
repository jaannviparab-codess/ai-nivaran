"use client";

import { STATUS_META } from "@/lib/constants";
import { useTranslation } from "@/i18n/I18nProvider";
import type { IssueStatus } from "@/lib/types";
import { cn } from "@/lib/utils";

export function StatusBadge({ status, className }: { status: IssueStatus; className?: string }) {
  const meta = STATUS_META[status];
  const { t } = useTranslation();
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium transition-transform duration-150 hover:scale-105",
        meta.bg,
        meta.text,
        className
      )}
    >
      <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: meta.color }} />
      {t(`status.${status}`)}
    </span>
  );
}
