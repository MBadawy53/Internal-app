"use client";

import { useLocale } from "next-intl";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import type { LeadFormField } from "@/lib/leadForm/types";

export function LeadCustomFields({
  fields,
  idPrefix = "cf",
}: {
  fields: LeadFormField[];
  idPrefix?: string;
}) {
  const locale = useLocale();
  const isAr = locale === "ar";

  if (fields.length === 0) return null;

  return (
    <>
      {fields.map((f) => {
        const inputId = `${idPrefix}-${f.id}`;
        const name = `cf_${f.id}`;
        const label = isAr ? f.labelAr : f.labelEn;
        const placeholder = (isAr ? f.placeholderAr : f.placeholderEn) ?? "";
        const help = (isAr ? f.helpAr : f.helpEn) ?? "";

        const labelEl = (
          <Label htmlFor={inputId}>
            {label}
            {f.required ? <span className="ms-1 text-destructive">*</span> : null}
          </Label>
        );
        const helpEl = help ? <p className="text-xs text-muted-foreground">{help}</p> : null;

        if (f.type === "BOOLEAN") {
          return (
            <label
              key={f.id}
              className="col-span-full flex items-start gap-2 rounded-md border bg-secondary/30 p-3 text-sm"
            >
              <Checkbox id={inputId} name={name} required={f.required} />
              <span>
                {label}
                {f.required ? <span className="ms-1 text-destructive">*</span> : null}
                {help ? <span className="block text-xs text-muted-foreground">{help}</span> : null}
              </span>
            </label>
          );
        }

        if (f.type === "TEXTAREA") {
          return (
            <div key={f.id} className="col-span-full space-y-1.5">
              {labelEl}
              <Textarea
                id={inputId}
                name={name}
                rows={3}
                maxLength={f.maxLength ?? 1000}
                placeholder={placeholder}
                required={f.required}
              />
              {helpEl}
            </div>
          );
        }

        if (f.type === "SELECT") {
          return (
            <div key={f.id} className="space-y-1.5">
              {labelEl}
              <Select id={inputId} name={name} defaultValue="" required={f.required}>
                <option value="" disabled={f.required}>
                  —
                </option>
                {(f.options ?? []).map((o) => (
                  <option key={o.value} value={o.value}>
                    {isAr ? o.labelAr : o.labelEn}
                  </option>
                ))}
              </Select>
              {helpEl}
            </div>
          );
        }

        const inputType = f.type === "NUMBER" ? "number" : f.type === "DATE" ? "date" : "text";
        return (
          <div key={f.id} className="space-y-1.5">
            {labelEl}
            <Input
              id={inputId}
              name={name}
              type={inputType}
              placeholder={placeholder}
              required={f.required}
              maxLength={f.type === "TEXT" ? (f.maxLength ?? 160) : undefined}
              min={f.type === "NUMBER" ? f.min : undefined}
              max={f.type === "NUMBER" ? f.max : undefined}
            />
            {helpEl}
          </div>
        );
      })}
    </>
  );
}
