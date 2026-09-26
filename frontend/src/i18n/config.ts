// Locale configuration shared by the server layout (initial render) and the
// client-side I18nProvider. Pure data + pure functions only — safe to import
// from Server Components, Client Components and middleware alike.

export const LOCALES = ["en", "hi", "mr"] as const;
export type Locale = (typeof LOCALES)[number];

export const DEFAULT_LOCALE: Locale = "en";

/** Cookie lets the server render the right language on first paint (no flash of English). */
export const LOCALE_COOKIE = "nvr_locale";
/** localStorage mirror of the cookie — survives cookie clearing and is read on the client. */
export const LOCALE_STORAGE_KEY = "nvr_locale";

export interface LanguageOption {
  code: Locale;
  /** Always shown in its own script so a user can find their language regardless of the current UI language. */
  nativeName: string;
  /** BCP-47 tag used for Intl date/number formatting. Latin digits are forced for consistency with IDs and scores. */
  intlLocale: string;
}

export const LANGUAGE_OPTIONS: LanguageOption[] = [
  { code: "en", nativeName: "English", intlLocale: "en-IN" },
  { code: "hi", nativeName: "हिंदी", intlLocale: "hi-IN-u-nu-latn" },
  { code: "mr", nativeName: "मराठी", intlLocale: "mr-IN-u-nu-latn" },
];

export function isLocale(value: unknown): value is Locale {
  return typeof value === "string" && (LOCALES as readonly string[]).includes(value);
}

export function intlLocaleFor(locale: Locale): string {
  return LANGUAGE_OPTIONS.find((l) => l.code === locale)?.intlLocale ?? "en-IN";
}

/**
 * Maps a list of browser language tags (navigator.languages or a parsed
 * Accept-Language header, in preference order) to a supported locale.
 * Marathi → mr, Hindi → hi, anything else → English.
 */
export function matchLocale(languages: readonly string[]): Locale {
  for (const tag of languages) {
    const base = tag.trim().toLowerCase().split(/[-_]/)[0];
    if (isLocale(base)) return base;
  }
  return DEFAULT_LOCALE;
}

export function parseAcceptLanguage(header: string | null | undefined): string[] {
  if (!header) return [];
  return header
    .split(",")
    .map((part) => {
      const [tag, ...params] = part.trim().split(";");
      const q = params.find((p) => p.trim().startsWith("q="));
      return { tag, q: q ? Number(q.trim().slice(2)) || 0 : 1 };
    })
    .filter((entry) => entry.tag)
    .sort((a, b) => b.q - a.q)
    .map((entry) => entry.tag);
}
