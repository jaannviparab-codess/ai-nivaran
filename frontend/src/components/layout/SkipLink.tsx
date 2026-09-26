"use client";

import { useTranslation } from "@/i18n/I18nProvider";

export function SkipLink() {
  const { t } = useTranslation();
  return (
    <a
      href="#main-content"
      className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[999] focus:rounded-lg focus:bg-primary-600 focus:px-4 focus:py-2 focus:text-white"
    >
      {t("common.skipToContent")}
    </a>
  );
}
