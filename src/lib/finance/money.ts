// Money value object — all money is stored as BigInt piastres (1 EGP = 100 piastres).
// Never use Float for money. All arithmetic is integer arithmetic on piastres.

export type Piastres = bigint;

/**
 * Convert a decimal EGP amount (number or string) to piastres.
 * Throws on negative numbers or non-finite inputs.
 */
export function egpToPiastres(egp: number | string): Piastres {
  const value = typeof egp === "string" ? Number(egp) : egp;
  if (!Number.isFinite(value)) throw new Error(`Invalid EGP amount: ${egp}`);
  if (value < 0) throw new Error(`Negative EGP amount: ${egp}`);
  // Round to nearest piastre to avoid float drift.
  return BigInt(Math.round(value * 100));
}

/**
 * Convert piastres to a Number EGP amount. Used only for UI display, never for math.
 */
export function piastresToNumberEgp(p: Piastres): number {
  return Number(p) / 100;
}

/**
 * Format piastres for display in the active locale.
 * Egyptian Pound symbol: "£" (code: EGP). Arabic uses Arabic-Indic digits automatically.
 */
export function formatMoney(p: Piastres, locale: "en" | "ar" = "en"): string {
  const intlLocale = locale === "ar" ? "ar-EG" : "en-EG";
  return new Intl.NumberFormat(intlLocale, {
    style: "currency",
    currency: "EGP",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(piastresToNumberEgp(p));
}

/** Multiply piastres by a basis-points rate (10000 bps = 100%). Returns piastres. */
export function applyBps(amountPiastres: Piastres, bps: number): Piastres {
  // (amount * bps) / 10000, rounded half-up.
  const numerator = amountPiastres * BigInt(bps);
  return (numerator + 5000n) / 10000n;
}

/** Clamp piastres to [min, max]. */
export function clamp(value: Piastres, min: Piastres, max: Piastres): Piastres {
  if (max > 0n && value > max) return max;
  if (value < min) return min;
  return value;
}

/** Format basis points as a percentage string. 1850 → "18.50%" */
export function formatBps(bps: number, locale: "en" | "ar" = "en"): string {
  const intlLocale = locale === "ar" ? "ar-EG" : "en-EG";
  return new Intl.NumberFormat(intlLocale, {
    style: "percent",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(bps / 10_000);
}
