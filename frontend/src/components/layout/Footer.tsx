"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ShieldCheck } from "lucide-react";
import { useTranslation } from "@/i18n/I18nProvider";
import type { TranslationKey } from "@/i18n/translate";

const AUTH_ROUTES = ["/login", "/register", "/forgot-password"];

const COLUMNS: { titleKey: TranslationKey; links: { labelKey: TranslationKey; href: string }[] }[] = [
  {
    titleKey: "footer.product",
    links: [
      { labelKey: "footer.reportProblem", href: "/report" },
      { labelKey: "footer.publicIssueMap", href: "/map" },
      { labelKey: "footer.trackIssue", href: "/track" },
      { labelKey: "footer.analytics", href: "/analytics" },
    ],
  },
  {
    titleKey: "footer.community",
    links: [
      { labelKey: "footer.communityHub", href: "/community" },
      { labelKey: "footer.aiAssistant", href: "/assistant" },
    ],
  },
];

export function Footer() {
  const pathname = usePathname();
  const { t, locale } = useTranslation();
  if (AUTH_ROUTES.includes(pathname)) return null;

  return (
    <footer className="border-t border-border bg-white">
      <div className="container grid gap-10 py-14 sm:grid-cols-2 lg:grid-cols-4">
        <div className="lg:col-span-2">
          <Link href="/" className="flex items-center gap-2.5 font-bold text-foreground">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-primary-600 to-secondary-600 text-white">
              <span className="font-devanagari text-lg leading-normal">नि</span>
            </span>
            <span className="font-devanagari text-base">निवारण AI</span>
          </Link>
          {/* The Marathi motto is part of the brand; the second line follows the UI language. */}
          <p className="mt-4 max-w-sm font-devanagari text-sm text-muted-foreground">
            समस्या नोंदवा, निवारणाचा मागोवा घ्या.
          </p>
          {locale !== "mr" && <p className="text-sm text-muted-foreground">{t("common.tagline")}</p>}
          <div className="mt-5 flex items-start gap-2 rounded-xl bg-muted p-3 text-xs text-muted-foreground">
            <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-primary-600" />
            <p>{t("footer.disclaimer")}</p>
          </div>
        </div>

        {COLUMNS.map((col) => (
          <div key={col.titleKey}>
            <h3 className="text-sm font-semibold text-foreground">{t(col.titleKey)}</h3>
            <ul className="mt-4 space-y-2.5">
              {col.links.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="text-sm text-muted-foreground hover:text-primary-600">
                    {t(link.labelKey)}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="border-t border-border py-6">
        <div className="container flex flex-col items-center justify-between gap-2 text-xs text-muted-foreground sm:flex-row">
          <p>{t("footer.copyright", { year: new Date().getFullYear() })}</p>
          <p>{t("footer.notAffiliated")}</p>
        </div>
      </div>
    </footer>
  );
}
