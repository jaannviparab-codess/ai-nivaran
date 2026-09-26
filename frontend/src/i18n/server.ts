import { cookies, headers } from "next/headers";
import { LOCALE_COOKIE, isLocale, matchLocale, parseAcceptLanguage, type Locale } from "./config";

/**
 * Resolves the locale for the current request: an explicit user choice
 * (cookie) wins; otherwise the browser's Accept-Language decides
 * (Marathi → mr, Hindi → hi, anything else → English).
 */
export function getServerLocale(): Locale {
  const fromCookie = cookies().get(LOCALE_COOKIE)?.value;
  if (isLocale(fromCookie)) return fromCookie;
  return matchLocale(parseAcceptLanguage(headers().get("accept-language")));
}
