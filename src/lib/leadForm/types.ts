import { z } from "zod";

export const LEAD_FORM_FIELD_TYPES = [
  "TEXT",
  "TEXTAREA",
  "NUMBER",
  "SELECT",
  "BOOLEAN",
  "DATE",
] as const;

export type LeadFormFieldType = (typeof LEAD_FORM_FIELD_TYPES)[number];

export interface LeadFormFieldOption {
  value: string;
  labelEn: string;
  labelAr: string;
}

export interface LeadFormField {
  /** Stable key — used as the JSON key on Lead.customFields. */
  id: string;
  type: LeadFormFieldType;
  labelEn: string;
  labelAr: string;
  placeholderEn?: string;
  placeholderAr?: string;
  helpEn?: string;
  helpAr?: string;
  required: boolean;
  /** SELECT only. */
  options?: LeadFormFieldOption[];
  /** NUMBER only. */
  min?: number;
  max?: number;
  /** TEXT / TEXTAREA — soft cap shown in UI; the server clamps to 4000. */
  maxLength?: number;
  sortOrder: number;
}

const optionSchema = z.object({
  value: z.string().min(1).max(80),
  labelEn: z.string().min(1).max(120),
  labelAr: z.string().min(1).max(120),
});

export const leadFormFieldSchema: z.ZodType<LeadFormField> = z
  .object({
    id: z
      .string()
      .min(1)
      .max(64)
      .regex(/^[a-z][a-z0-9_]*$/u, "Field key must be snake_case starting with a letter"),
    type: z.enum(LEAD_FORM_FIELD_TYPES),
    labelEn: z.string().min(1).max(120),
    labelAr: z.string().min(1).max(120),
    placeholderEn: z.string().max(160).optional(),
    placeholderAr: z.string().max(160).optional(),
    helpEn: z.string().max(240).optional(),
    helpAr: z.string().max(240).optional(),
    required: z.boolean(),
    options: z.array(optionSchema).max(40).optional(),
    min: z.number().finite().optional(),
    max: z.number().finite().optional(),
    maxLength: z.number().int().positive().max(4000).optional(),
    sortOrder: z.number().int().nonnegative(),
  })
  .superRefine((f, ctx) => {
    if (f.type === "SELECT") {
      if (!f.options || f.options.length === 0) {
        ctx.addIssue({
          code: "custom",
          path: ["options"],
          message: "At least one option is required for a dropdown.",
        });
      }
    }
    if (f.min !== undefined && f.max !== undefined && f.min > f.max) {
      ctx.addIssue({
        code: "custom",
        path: ["max"],
        message: "Max must be greater than or equal to min.",
      });
    }
  });

export const leadFormFieldsSchema = z.array(leadFormFieldSchema).max(40);

/** Parse a Lead.customFields JSON value into a typed map (best effort). */
export function readCustomFields(raw: unknown): Record<string, string | number | boolean> {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return {};
  const out: Record<string, string | number | boolean> = {};
  for (const [k, v] of Object.entries(raw as Record<string, unknown>)) {
    if (typeof v === "string" || typeof v === "number" || typeof v === "boolean") out[k] = v;
  }
  return out;
}

/** Parse a LeadFormTemplate.fields JSON value into typed fields. */
export function readFields(raw: unknown): LeadFormField[] {
  const parsed = leadFormFieldsSchema.safeParse(raw);
  if (!parsed.success) return [];
  return [...parsed.data].sort((a, b) => a.sortOrder - b.sortOrder);
}

/**
 * Coerce + validate the user-submitted FormData values against a field
 * definition. Returns either the typed value to persist, or an error message.
 * `null` means "leave it out of the answers map" (empty optional field).
 */
export function coerceAnswer(
  field: LeadFormField,
  raw: string | undefined,
): { ok: true; value: string | number | boolean | null } | { ok: false; message: string } {
  const v = (raw ?? "").trim();

  if (field.type === "BOOLEAN") {
    const truthy = v === "on" || v === "true" || v === "1" || v === "yes";
    if (field.required && !truthy) {
      return { ok: false, message: `${field.labelEn} is required.` };
    }
    return { ok: true, value: truthy };
  }

  if (v === "") {
    if (field.required) return { ok: false, message: `${field.labelEn} is required.` };
    return { ok: true, value: null };
  }

  switch (field.type) {
    case "TEXT":
    case "TEXTAREA": {
      const cap = Math.min(field.maxLength ?? 1000, 4000);
      return { ok: true, value: v.slice(0, cap) };
    }
    case "NUMBER": {
      const n = Number(v);
      if (!Number.isFinite(n)) {
        return { ok: false, message: `${field.labelEn} must be a number.` };
      }
      if (field.min !== undefined && n < field.min) {
        return { ok: false, message: `${field.labelEn} must be ≥ ${field.min}.` };
      }
      if (field.max !== undefined && n > field.max) {
        return { ok: false, message: `${field.labelEn} must be ≤ ${field.max}.` };
      }
      return { ok: true, value: n };
    }
    case "SELECT": {
      const allowed = (field.options ?? []).map((o) => o.value);
      if (!allowed.includes(v)) {
        return { ok: false, message: `${field.labelEn}: invalid option.` };
      }
      return { ok: true, value: v };
    }
    case "DATE": {
      const d = new Date(v);
      if (Number.isNaN(d.getTime())) {
        return { ok: false, message: `${field.labelEn} must be a valid date.` };
      }
      return { ok: true, value: v };
    }
    default:
      return { ok: true, value: v };
  }
}

/** Build the validated customFields map from form data, given the template. */
export function buildCustomFieldsFromForm(
  fields: LeadFormField[],
  formData: FormData,
):
  | { ok: true; values: Record<string, string | number | boolean> }
  | { ok: false; message: string } {
  const out: Record<string, string | number | boolean> = {};
  for (const f of fields) {
    const raw = formData.get(`cf_${f.id}`);
    const coerced = coerceAnswer(f, typeof raw === "string" ? raw : undefined);
    if (!coerced.ok) return coerced;
    if (coerced.value !== null) out[f.id] = coerced.value;
  }
  return { ok: true, values: out };
}
