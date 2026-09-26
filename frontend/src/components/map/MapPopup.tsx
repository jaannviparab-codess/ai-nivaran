"use client";

import Link from "next/link";
import { ArrowRight, Users } from "lucide-react";
import { StatusBadge } from "@/components/issues/StatusBadge";
import { SeverityBadge } from "@/components/issues/SeverityBadge";
import type { IssueListItem } from "@/lib/types";
import { useTranslation } from "@/i18n/I18nProvider";

export function MapPopup({ issue }: { issue: IssueListItem }) {
  const { t, formatRelativeTime } = useTranslation();
  return (
    <div className="w-[248px]">
      {issue.thumbnailUrl && <img src={issue.thumbnailUrl} alt="" className="h-28 w-full object-cover" />}
      <div className="space-y-2 p-3">
        <p className="text-sm font-semibold leading-snug text-foreground">{issue.title}</p>
        <p className="text-xs text-muted-foreground">{t(`category.${issue.category}`)}</p>
        <div className="flex flex-wrap gap-1.5">
          <SeverityBadge severity={issue.severity} />
          <StatusBadge status={issue.status} />
        </div>
        <div className="flex items-center justify-between pt-1 text-[11px] text-muted-foreground">
          <span className="flex items-center gap-1">
            <Users className="h-3 w-3" /> {t("map.popup.confirmations", { count: issue.confirmationCount })}
          </span>
          <span>{formatRelativeTime(issue.reportedAt)}</span>
        </div>
        <Link
          href={`/issues/${issue.id}`}
          className="flex items-center justify-center gap-1 rounded-lg bg-primary-600 py-1.5 text-xs font-medium text-white hover:bg-primary-700"
        >
          {t("map.popup.viewDetails")} <ArrowRight className="h-3 w-3" />
        </Link>
      </div>
    </div>
  );
}
