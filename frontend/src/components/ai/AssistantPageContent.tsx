"use client";

import { Bot, Copy, Gauge, Mic } from "lucide-react";
import { AIChatWindow } from "@/components/ai/AIChatWindow";
import { Card, CardContent } from "@/components/ui/Card";
import { useDocumentTitle } from "@/lib/hooks/useDocumentTitle";
import { useTranslation } from "@/i18n/I18nProvider";
import type { TranslationKey } from "@/i18n/translate";

const HIGHLIGHTS: { icon: typeof Bot; titleKey: TranslationKey; descriptionKey: TranslationKey }[] = [
  { icon: Bot, titleKey: "assistant.guidedTitle", descriptionKey: "assistant.guidedDesc" },
  { icon: Gauge, titleKey: "assistant.scoresTitle", descriptionKey: "assistant.scoresDesc" },
  { icon: Copy, titleKey: "assistant.duplicatesTitle", descriptionKey: "assistant.duplicatesDesc" },
  { icon: Mic, titleKey: "assistant.multilingualTitle", descriptionKey: "assistant.multilingualDesc" },
];

export function AssistantPageContent() {
  const { t } = useTranslation();
  useDocumentTitle(t("assistant.docTitle"));

  return (
    <div className="container max-w-5xl py-10 sm:py-14">
      <div className="mb-8 text-center">
        <span className="inline-flex items-center gap-2 rounded-full bg-primary-50 px-4 py-1.5 text-xs font-semibold text-primary-700">
          <Bot className="h-3.5 w-3.5" /> {t("assistant.badge")}
        </span>
        <h1 className="mt-4 text-3xl font-bold tracking-tight text-foreground sm:text-4xl">{t("assistant.title")}</h1>
        <p className="mx-auto mt-2 max-w-xl text-muted-foreground">{t("assistant.subtitle")}</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
        <Card className="overflow-hidden">
          <AIChatWindow variant="page" />
        </Card>

        <div className="space-y-4">
          {HIGHLIGHTS.map((item) => (
            <Card key={item.titleKey}>
              <CardContent className="flex items-start gap-3 pt-6">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary-50 text-primary-600">
                  <item.icon className="h-4.5 w-4.5" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">{t(item.titleKey)}</p>
                  <p className="text-xs text-muted-foreground">{t(item.descriptionKey)}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
