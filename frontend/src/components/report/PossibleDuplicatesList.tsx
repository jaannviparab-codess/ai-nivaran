import Link from "next/link";
import { Copy, Users } from "lucide-react";
import type { IssueListItem } from "@/lib/types";
import { ISSUE_CATEGORIES } from "@/lib/types";

export function PossibleDuplicatesList({ issues }: { issues: IssueListItem[] }) {
  if (issues.length === 0) return null;

  return (
    <div className="rounded-2xl border border-warning-100 bg-warning-50 p-4">
      <p className="flex items-center gap-2 text-sm font-semibold text-warning-600">
        <Copy className="h-4 w-4" /> Possible duplicate issue{issues.length > 1 ? "s" : ""} nearby
      </p>
      <p className="mt-1 text-xs text-warning-600/80">
        We found {issues.length} existing report{issues.length > 1 ? "s" : ""} of the same type close to this
        location. Submitting will add your confirmation to that issue instead of creating a separate one.
      </p>
      <div className="mt-3 space-y-2">
        {issues.map((issue) => {
          const categoryMeta = ISSUE_CATEGORIES.find((c) => c.value === issue.category);
          return (
            <Link
              key={issue.id}
              href={`/issues/${issue.id}`}
              target="_blank"
              className="flex items-center justify-between gap-3 rounded-xl bg-white/70 px-3 py-2 text-xs hover:bg-white"
            >
              <span className="truncate font-medium text-foreground">{issue.title}</span>
              <span className="flex shrink-0 items-center gap-1 text-muted-foreground">
                <Users className="h-3 w-3" /> {issue.confirmationCount} · {categoryMeta?.labelEn}
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
