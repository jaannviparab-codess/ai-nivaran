"use client";

import { AlertTriangle } from "lucide-react";
import { useTranslation } from "@/i18n/I18nProvider";
import { Button } from "./Button";
import { cn } from "@/lib/utils";

export function ErrorState({
  title,
  description,
  onRetry,
  className,
}: {
  title?: string;
  description?: string;
  onRetry?: () => void;
  className?: string;
}) {
  const { t } = useTranslation();
  return (
    <div
      role="alert"
      className={cn("flex flex-col items-center justify-center gap-3 rounded-2xl border border-critical-100 bg-critical-50 py-16 px-6 text-center", className)}
    >
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-critical-100">
        <AlertTriangle className="h-6 w-6 text-critical-600" />
      </div>
      <p className="font-medium text-foreground">{title ?? t("common.somethingWentWrong")}</p>
      <p className="max-w-sm text-sm text-muted-foreground">{description ?? t("common.pleaseTryAgain")}</p>
      {onRetry && (
        <Button variant="outline" size="sm" onClick={onRetry}>
          {t("common.tryAgain")}
        </Button>
      )}
    </div>
  );
}
