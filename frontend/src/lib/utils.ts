import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Formatters take an Intl locale tag so the UI language drives date/number
// output; components get pre-bound versions from useTranslation().

export function formatRelativeTime(iso: string, intlLocale = "en-IN", justNowLabel = "just now"): string {
  const date = new Date(iso);
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  const intervals: [number, Intl.RelativeTimeFormatUnit][] = [
    [31536000, "year"],
    [2592000, "month"],
    [86400, "day"],
    [3600, "hour"],
    [60, "minute"],
  ];
  const rtf = new Intl.RelativeTimeFormat(intlLocale, { numeric: "always" });
  for (const [secs, unit] of intervals) {
    const count = Math.floor(seconds / secs);
    if (count >= 1) return rtf.format(-count, unit);
  }
  return justNowLabel;
}

export function formatDate(iso: string, intlLocale = "en-IN"): string {
  return new Date(iso).toLocaleDateString(intlLocale, {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function formatDateTime(iso: string, intlLocale = "en-IN"): string {
  return new Date(iso).toLocaleString(intlLocale, {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatNumber(value: number, intlLocale = "en-IN"): string {
  return value.toLocaleString(intlLocale);
}

const MONTH_ABBREVIATIONS = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"];

/** Localizes an English month abbreviation from the analytics API ("Apr"); returns other values unchanged. */
export function formatMonthLabel(label: string, intlLocale = "en-IN"): string {
  const index = MONTH_ABBREVIATIONS.indexOf(label.trim().slice(0, 3).toLowerCase());
  if (index === -1) return label;
  return new Date(2000, index, 1).toLocaleDateString(intlLocale, { month: "short" });
}

export function truncate(text: string, max: number): string {
  if (text.length <= max) return text;
  return `${text.slice(0, max).trim()}…`;
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

export function generateTrackingId(): string {
  const year = new Date().getFullYear();
  const rand = Math.random().toString(36).slice(2, 7).toUpperCase();
  return `NVR-${year}-${rand}`;
}
