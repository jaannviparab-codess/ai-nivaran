"use client";

import { useEffect } from "react";
import { ErrorState } from "@/components/ui/ErrorState";
import { useTranslation } from "@/i18n/I18nProvider";

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const { t } = useTranslation();
  useEffect(() => {
    console.error("Unhandled application error:", error);
  }, [error]);

  return (
    <div className="container flex min-h-[60vh] items-center justify-center py-16">
      <ErrorState
        title={t("errors.pageTitle")}
        description={t("errors.pageDescription")}
        onRetry={reset}
        className="max-w-md"
      />
    </div>
  );
}
