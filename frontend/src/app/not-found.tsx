"use client";

import { MapPinOff } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { useTranslation } from "@/i18n/I18nProvider";

export default function NotFound() {
  const { t } = useTranslation();
  return (
    <div className="container flex min-h-[60vh] flex-col items-center justify-center py-16 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted">
        <MapPinOff className="h-8 w-8 text-muted-foreground" />
      </div>
      <h1 className="mt-6 text-2xl font-bold text-foreground">{t("errors.notFoundTitle")}</h1>
      <p className="mt-2 max-w-sm text-muted-foreground">
        {t("errors.notFoundDescription")}
      </p>
      <div className="mt-6 flex gap-3">
        <Button href="/">{t("errors.backHome")}</Button>
        <Button href="/map" variant="outline">
          {t("errors.exploreMap")}
        </Button>
      </div>
      <p className="mt-4 text-xs text-muted-foreground">
        {t("errors.lookingForReport")}{" "}
        <Link href="/track" className="font-medium text-primary-700 hover:underline">
          {t("errors.trackItHere")}
        </Link>
        .
      </p>
    </div>
  );
}
