import type { AppLocale } from "./config";

/**
 * Pick the locale-appropriate field from a record with `*En` and `*Ar` variants.
 * Falls back to the EN value when AR is empty.
 */
export function localized(
  locale: AppLocale,
  en: string | null | undefined,
  ar: string | null | undefined,
): string {
  if (locale === "ar") return (ar && ar.length > 0 ? ar : en) ?? "";
  return en ?? ar ?? "";
}
