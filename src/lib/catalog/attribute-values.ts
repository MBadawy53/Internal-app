import type { AttributeType } from "@prisma/client";

// Each attribute's `options` JSON for SELECT type is a list of these.
export interface AttributeSelectOption {
  value: string;
  labelEn: string;
  labelAr: string;
}

export interface AttributeOptionsJson {
  options?: AttributeSelectOption[];
}

export function isAttributeType(value: string): value is AttributeType {
  return value === "TEXT" || value === "NUMBER" || value === "BOOLEAN" || value === "SELECT";
}

/**
 * Coerce a raw form value to the typed value we store in CategoryAttributeValue.value.
 * Throws on invalid input so the server action can surface a field error.
 */
export function coerceAttributeValue(
  type: AttributeType,
  raw: string,
  options?: AttributeSelectOption[],
): string | number | boolean {
  switch (type) {
    case "TEXT":
      return raw.trim();
    case "NUMBER": {
      const n = Number(raw);
      if (!Number.isFinite(n)) throw new Error("Invalid number");
      return n;
    }
    case "BOOLEAN":
      return raw === "true" || raw === "on" || raw === "1";
    case "SELECT": {
      const allowed = (options ?? []).map((o) => o.value);
      if (!allowed.includes(raw)) throw new Error(`Value "${raw}" not in options`);
      return raw;
    }
  }
}

export function formatAttributeValue(
  attribute: { type: AttributeType; options: unknown },
  value: unknown,
  locale: "en" | "ar",
): string {
  switch (attribute.type) {
    case "TEXT":
      return typeof value === "string" ? value : "";
    case "NUMBER":
      return typeof value === "number"
        ? new Intl.NumberFormat(locale === "ar" ? "ar-EG" : "en-EG").format(value)
        : "";
    case "BOOLEAN":
      return value === true ? (locale === "ar" ? "نعم" : "Yes") : locale === "ar" ? "لا" : "No";
    case "SELECT": {
      if (typeof value !== "string") return "";
      const opts = (attribute.options as AttributeOptionsJson | null)?.options ?? [];
      const match = opts.find((o) => o.value === value);
      if (!match) return value;
      return locale === "ar" ? match.labelAr : match.labelEn;
    }
  }
}
