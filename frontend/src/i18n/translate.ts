// Pure translation helpers — no React, no browser APIs — so the same lookup
// logic serves the server layout and the client provider.

import type { Locale } from "./config";
import en from "./locales/en";
import hi from "./locales/hi";
import mr from "./locales/mr";

/** Shape every locale must match: English is the source of truth. */
export type Dictionary = Widen<typeof en>;
type Widen<T> = { [K in keyof T]: T[K] extends string ? string : Widen<T[K]> };

/** Union of every dotted leaf path, e.g. "nav.home" | "status.resolved" | … */
export type TranslationKey = Leaves<typeof en>;
type Leaves<T, P extends string = ""> = {
  [K in keyof T & string]: T[K] extends string ? `${P}${K}` : Leaves<T[K], `${P}${K}.`>;
}[keyof T & string];

export type TranslationVars = Record<string, string | number>;

export const DICTIONARIES: Record<Locale, Dictionary> = { en, hi, mr };

function lookup(dict: Dictionary, key: string): string | undefined {
  let node: unknown = dict;
  for (const part of key.split(".")) {
    if (node && typeof node === "object" && part in node) {
      node = (node as Record<string, unknown>)[part];
    } else {
      return undefined;
    }
  }
  return typeof node === "string" ? node : undefined;
}

export function interpolate(template: string, vars?: TranslationVars): string {
  if (!vars) return template;
  return template.replace(/\{(\w+)\}/g, (match, name: string) =>
    name in vars ? String(vars[name]) : match
  );
}

/**
 * Looks up `key` in the given locale, falling back to English and finally to
 * the key itself, so a missing translation degrades gracefully instead of
 * rendering blank UI.
 */
export function translate(locale: Locale, key: TranslationKey, vars?: TranslationVars): string {
  const value = lookup(DICTIONARIES[locale], key) ?? lookup(DICTIONARIES.en, key);
  if (value === undefined) {
    if (process.env.NODE_ENV !== "production") console.warn(`[i18n] Missing translation key: ${key}`);
    return key;
  }
  return interpolate(value, vars);
}

/** Like translate(), but for keys that come from runtime data (e.g. a backend label). Returns undefined when absent. */
export function translateOptional(locale: Locale, key: string, vars?: TranslationVars): string | undefined {
  const value = lookup(DICTIONARIES[locale], key) ?? lookup(DICTIONARIES.en, key);
  return value === undefined ? undefined : interpolate(value, vars);
}
