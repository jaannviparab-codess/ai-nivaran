"use client";

import { LoadingState } from "@/components/ui/LoadingState";
import { useTranslation } from "@/i18n/I18nProvider";

export default function RootLoading() {
  const { t } = useTranslation();
  return <LoadingState label={t("errors.appLoading")} className="min-h-[60vh]" />;
}
