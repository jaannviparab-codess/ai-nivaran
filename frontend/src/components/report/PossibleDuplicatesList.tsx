"use client";

import Link from "next/link";
import { Copy, Users } from "lucide-react";
import type { IssueListItem } from "@/lib/types";
import { useTranslation } from "@/i18n/I18nProvider";

export function PossibleDuplicatesList({ issues }: { issues: IssueListItem[] }) {
  const { t } = useTranslation();
  if (issues.length === 0) return null;
  const plural = issues.length === 1 ? "one" : "other";

  return (
    <div className="rounded-2xl border border-warning-100 bg-warning-50 p-4">
      <p className="flex items-center gap-2 text-sm font-semibold text-warning-600">
        <Copy className="h-4 w-4" /> {t(`report.duplicates.title.${plural}`)}
      </p>
      <p className="mt-1 text-xs text-warning-600/80">{t(`report.duplicates.description.${plural}`, { count: issues.length })}</p>
      <div className="mt-3 space-y-2">
        {issues.map((issue) => {
          return (
            <Link
              key={issue.id}
              href={`/issues/${issue.id}`}
              target="_blank"
              className="flex items-center justify-between gap-3 rounded-xl bg-white/70 px-3 py-2 text-xs hover:bg-white"
            >
              <span className="truncate font-medium text-foreground">{issue.title}</span>
              <span className="flex shrink-0 items-center gap-1 text-muted-foreground">
                <Users className="h-3 w-3" /> {issue.confirmationCount} · {t(`category.${issue.category}`)}
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
