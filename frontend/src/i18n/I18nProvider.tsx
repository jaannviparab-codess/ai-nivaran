"use client";

import { Fragment, createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import {
  DEFAULT_LOCALE,
  LOCALE_COOKIE,
  LOCALE_STORAGE_KEY,
  intlLocaleFor,
  isLocale,
  matchLocale,
  type Locale,
} from "./config";
import { translate, translateOptional, type TranslationKey, type TranslationVars } from "./translate";
import { formatDate, formatDateTime, formatMonthLabel, formatNumber, formatRelativeTime } from "@/lib/utils";

type RichTags = Record<string, (chunk: string) => React.ReactNode>;

interface I18nContextValue {
  locale: Locale;
  /** BCP-47 tag for Intl APIs (dates, numbers). */
  intlLocale: string;
  setLocale: (locale: Locale) => void;
  t: (key: TranslationKey, vars?: TranslationVars) => string;
  /** For keys built from runtime data; returns `fallback` when the key doesn't exist. */
  tOptional: (key: string, fallback: string, vars?: TranslationVars) => string;
  /** Translation containing simple inline tags, e.g. "Seen by <b>{count} citizens</b>". */
  rich: (key: TranslationKey, vars: TranslationVars | undefined, tags: RichTags) => React.ReactNode;
  formatDate: (iso: string) => string;
  formatDateTime: (iso: string) => string;
  formatRelativeTime: (iso: string) => string;
  formatNumber: (value: number) => string;
  formatMonthLabel: (label: string) => string;
}

const I18nContext = createContext<I18nContextValue | null>(null);

const ONE_YEAR_SECONDS = 60 * 60 * 24 * 365;

function readCookieLocale(): Locale | null {
  const match = document.cookie.match(new RegExp(`(?:^|; )${LOCALE_COOKIE}=([^;]*)`));
  const value = match ? decodeURIComponent(match[1]) : null;
  return isLocale(value) ? value : null;
}

function persistLocale(locale: Locale) {
  document.cookie = `${LOCALE_COOKIE}=${locale}; path=/; max-age=${ONE_YEAR_SECONDS}; SameSite=Lax`;
  try {
    window.localStorage.setItem(LOCALE_STORAGE_KEY, locale);
  } catch {
    // Storage can be unavailable (private mode, blocked site data); the cookie still persists the choice.
  }
}

function renderRich(text: string, tags: RichTags): React.ReactNode {
  const parts: React.ReactNode[] = [];
  const pattern = /<(\w+)>(.*?)<\/\1>/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  while ((match = pattern.exec(text)) !== null) {
    if (match.index > lastIndex) parts.push(text.slice(lastIndex, match.index));
    const render = tags[match[1]];
    parts.push(<Fragment key={match.index}>{render ? render(match[2]) : match[2]}</Fragment>);
    lastIndex = pattern.lastIndex;
  }
  if (lastIndex < text.length) parts.push(text.slice(lastIndex));
  return parts;
}

export function I18nProvider({
  initialLocale = DEFAULT_LOCALE,
  children,
}: {
  /** Resolved on the server from the locale cookie / Accept-Language, so SSR output already matches. */
  initialLocale?: Locale;
  children: React.ReactNode;
}) {
  const [locale, setLocaleState] = useState<Locale>(initialLocale);

  // Reconcile with client-only state once on mount. The cookie is authoritative
  // (a manual choice); if it's missing but localStorage remembers a choice,
  // restore it; with neither, fall back to the browser's language preference.
  useEffect(() => {
    const fromCookie = readCookieLocale();
    if (fromCookie) {
      if (fromCookie !== locale) setLocaleState(fromCookie);
      return;
    }
    let stored: string | null = null;
    try {
      stored = window.localStorage.getItem(LOCALE_STORAGE_KEY);
    } catch {
      stored = null;
    }
    if (isLocale(stored)) {
      persistLocale(stored);
      setLocaleState(stored);
      return;
    }
    const detected = matchLocale(navigator.languages?.length ? navigator.languages : [navigator.language]);
    if (detected !== locale) setLocaleState(detected);
    // Deliberately not persisted: a detected language is only a default until the user picks one.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);

  const setLocale = useCallback((next: Locale) => {
    persistLocale(next);
    setLocaleState(next);
  }, []);

  const value = useMemo<I18nContextValue>(() => {
    const intlLocale = intlLocaleFor(locale);
    const t = (key: TranslationKey, vars?: TranslationVars) => translate(locale, key, vars);
    return {
      locale,
      intlLocale,
      setLocale,
      t,
      tOptional: (key, fallback, vars) => translateOptional(locale, key, vars) ?? fallback,
      rich: (key, vars, tags) => renderRich(t(key, vars), tags),
      formatDate: (iso) => formatDate(iso, intlLocale),
      formatDateTime: (iso) => formatDateTime(iso, intlLocale),
      formatRelativeTime: (iso) => formatRelativeTime(iso, intlLocale, t("common.justNow")),
      formatNumber: (n) => formatNumber(n, intlLocale),
      formatMonthLabel: (label) => formatMonthLabel(label, intlLocale),
    };
  }, [locale, setLocale]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useTranslation() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useTranslation must be used within I18nProvider");
  return ctx;
}
