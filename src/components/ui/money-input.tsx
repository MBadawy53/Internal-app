"use client";

// A text input that shows a number with thousand separators as the user
// types. The underlying value submitted with a form (or returned via
// onChange) is always a raw numeric string like "1234.5" — never a
// locale-formatted one — so callers can keep doing `Number(value)` /
// `egpToPiastres(value)` server-side without changes.
//
// Supports both controlled and uncontrolled modes:
// - Controlled: pass `value` + `onChange`. Useful for React-managed pages
//   like the calculator.
// - Uncontrolled: pass `defaultValue` + `name`. A hidden input named
//   `name` carries the raw value into the form submission.
//
// Browser-level min/max are not applied since the input is type="text";
// validate min/max on the server (we already do via zod / refine).

import { useId, useState, type ChangeEvent } from "react";
import { Input } from "@/components/ui/input";
import { useLocale } from "next-intl";

interface Props {
  id?: string;
  name?: string;
  value?: string;
  defaultValue?: string | number | null;
  onChange?: (raw: string) => void;
  /** Allow decimals (.). Default true. Disable for integer-only inputs. */
  allowDecimals?: boolean;
  required?: boolean;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  autoFocus?: boolean;
  "aria-describedby"?: string;
  /** Maximum number of decimal places to keep. Default 2 (piastres precision). */
  decimalScale?: number;
}

const ARABIC_INDIC = "٠١٢٣٤٥٦٧٨٩";

function arabicToLatin(s: string): string {
  return s.replace(/[٠-٩]/g, (d) => String(ARABIC_INDIC.indexOf(d)));
}

function parseRaw(input: string, allowDecimals: boolean, decimalScale: number): string {
  let v = arabicToLatin(input).replace(/[^\d.]/g, "");
  if (!allowDecimals) {
    v = v.replace(/\./g, "");
  } else {
    const dot = v.indexOf(".");
    if (dot !== -1) {
      const intPart = v.slice(0, dot);
      const decPart = v
        .slice(dot + 1)
        .replace(/\./g, "")
        .slice(0, decimalScale);
      v = `${intPart}.${decPart}`;
    }
  }
  // Drop leading zeros except a single one ("007" → "7", but "0.5" stays).
  if (v.startsWith("0") && v.length > 1 && v[1] !== ".") {
    v = v.replace(/^0+/, "") || "0";
  }
  return v;
}

function formatRaw(raw: string, locale: string): string {
  if (raw === "") return "";
  const parts = raw.split(".");
  const intPart = parts[0] ?? "";
  const decPart = parts.length > 1 ? (parts[1] ?? "") : null;
  let intFormatted = "";
  if (intPart !== "") {
    try {
      intFormatted = new Intl.NumberFormat(locale, { useGrouping: true }).format(BigInt(intPart));
    } catch {
      intFormatted = intPart;
    }
  }
  if (decPart !== null) {
    const decimalSep = locale === "ar-EG" ? "٫" : ".";
    return `${intFormatted || "0"}${decimalSep}${decPart}`;
  }
  return intFormatted;
}

export function MoneyInput({
  id,
  name,
  value,
  defaultValue,
  onChange,
  allowDecimals = true,
  decimalScale = 2,
  required,
  placeholder,
  className,
  disabled,
  autoFocus,
  ...aria
}: Props) {
  const locale = useLocale() === "ar" ? "ar-EG" : "en-EG";
  const reactId = useId();
  const inputId = id ?? reactId;

  const initial =
    defaultValue == null || defaultValue === ""
      ? ""
      : parseRaw(String(defaultValue), allowDecimals, decimalScale);

  const isControlled = value !== undefined;
  const [internal, setInternal] = useState<string>(initial);
  const raw = isControlled ? parseRaw(value, allowDecimals, decimalScale) : internal;

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const next = parseRaw(e.target.value, allowDecimals, decimalScale);
    if (!isControlled) setInternal(next);
    onChange?.(next);
  };

  return (
    <>
      {name ? <input type="hidden" name={name} value={raw} /> : null}
      <Input
        id={inputId}
        type="text"
        inputMode={allowDecimals ? "decimal" : "numeric"}
        value={formatRaw(raw, locale)}
        onChange={handleChange}
        required={required}
        placeholder={placeholder}
        className={className}
        disabled={disabled}
        autoFocus={autoFocus}
        autoComplete="off"
        {...aria}
      />
    </>
  );
}
