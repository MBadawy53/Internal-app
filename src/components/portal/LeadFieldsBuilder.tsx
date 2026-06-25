"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { ArrowDown, ArrowUp, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import {
  LEAD_FORM_FIELD_TYPES,
  type LeadFormField,
  type LeadFormFieldType,
} from "@/lib/leadForm/types";

export interface CopySource {
  id: string;
  name: string;
  fields: LeadFormField[];
}

interface Props {
  initial: LeadFormField[];
  copySources?: CopySource[];
}

function newId(existing: LeadFormField[]): string {
  for (let i = existing.length + 1; ; i++) {
    const candidate = `field_${i}`;
    if (!existing.some((f) => f.id === candidate)) return candidate;
  }
}

function emptyField(existing: LeadFormField[]): LeadFormField {
  return {
    id: newId(existing),
    type: "TEXT",
    labelEn: "",
    labelAr: "",
    required: false,
    sortOrder: existing.length,
  };
}

export function LeadFieldsBuilder({ initial, copySources = [] }: Props) {
  const t = useTranslations("qr.form.customFields");
  const tType = useTranslations("admin.leadForm.types");
  const [fields, setFields] = useState<LeadFormField[]>(initial);

  const updateField = (idx: number, patch: Partial<LeadFormField>) =>
    setFields((prev) => prev.map((f, i) => (i === idx ? { ...f, ...patch } : f)));

  const move = (idx: number, dir: -1 | 1) => {
    setFields((prev) => {
      const j = idx + dir;
      if (j < 0 || j >= prev.length) return prev;
      const next = [...prev];
      const tmp = next[idx]!;
      next[idx] = next[j]!;
      next[j] = tmp;
      return next.map((f, k) => ({ ...f, sortOrder: k }));
    });
  };

  const remove = (idx: number) =>
    setFields((prev) => prev.filter((_, i) => i !== idx).map((f, k) => ({ ...f, sortOrder: k })));

  const add = () => setFields((prev) => [...prev, emptyField(prev)]);

  const copyFrom = (sourceId: string) => {
    if (!sourceId) return;
    const src = copySources.find((s) => s.id === sourceId);
    if (!src) return;
    setFields(src.fields.map((f, k) => ({ ...f, sortOrder: k })));
  };

  return (
    <fieldset className="space-y-3 rounded-md border p-3">
      <legend className="px-1 text-sm font-medium">{t("title")}</legend>
      <p className="text-xs text-muted-foreground">{t("subtitle")}</p>

      <input type="hidden" name="customFields" value={JSON.stringify(fields)} />

      <div className="flex flex-wrap items-center justify-between gap-2">
        {copySources.length > 0 ? (
          <div className="flex items-center gap-2">
            <Label htmlFor="cf-copy" className="text-xs text-muted-foreground">
              {t("copyFrom")}
            </Label>
            <Select
              id="cf-copy"
              defaultValue=""
              onChange={(e) => {
                copyFrom(e.target.value);
                e.target.value = "";
              }}
              className="h-8 max-w-xs"
            >
              <option value="">{t("copyPlaceholder")}</option>
              {copySources.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </Select>
          </div>
        ) : (
          <span />
        )}
        <Button type="button" size="sm" variant="outline" onClick={add}>
          <Plus className="me-1 h-4 w-4" />
          {t("addField")}
        </Button>
      </div>

      {fields.length === 0 ? (
        <p className="rounded-md border border-dashed p-4 text-center text-xs text-muted-foreground">
          {t("empty")}
        </p>
      ) : (
        <ul className="space-y-3">
          {fields.map((f, idx) => (
            <li key={`${f.id}-${idx}`} className="rounded-md border bg-secondary/30 p-3">
              <div className="flex items-start justify-between gap-2">
                <p className="font-mono text-xs text-muted-foreground">{f.id}</p>
                <div className="flex gap-1">
                  <Button
                    type="button"
                    size="icon"
                    variant="ghost"
                    onClick={() => move(idx, -1)}
                    disabled={idx === 0}
                    aria-label="Move up"
                  >
                    <ArrowUp className="h-4 w-4" />
                  </Button>
                  <Button
                    type="button"
                    size="icon"
                    variant="ghost"
                    onClick={() => move(idx, 1)}
                    disabled={idx === fields.length - 1}
                    aria-label="Move down"
                  >
                    <ArrowDown className="h-4 w-4" />
                  </Button>
                  <Button
                    type="button"
                    size="icon"
                    variant="ghost"
                    onClick={() => remove(idx)}
                    aria-label="Remove field"
                    className="text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="mt-2 grid gap-3 md:grid-cols-2">
                <div className="space-y-1.5">
                  <Label>{t("fieldKey")}</Label>
                  <Input
                    value={f.id}
                    onChange={(e) =>
                      updateField(idx, {
                        id: e.target.value.toLowerCase().replace(/[^a-z0-9_]/gu, "_"),
                      })
                    }
                    maxLength={64}
                    spellCheck={false}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>{t("fieldType")}</Label>
                  <Select
                    value={f.type}
                    onChange={(e) =>
                      updateField(idx, { type: e.target.value as LeadFormFieldType })
                    }
                  >
                    {LEAD_FORM_FIELD_TYPES.map((typeName) => (
                      <option key={typeName} value={typeName}>
                        {tType(typeName)}
                      </option>
                    ))}
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>{t("labelEn")}</Label>
                  <Input
                    value={f.labelEn}
                    onChange={(e) => updateField(idx, { labelEn: e.target.value })}
                    maxLength={120}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>{t("labelAr")}</Label>
                  <Input
                    value={f.labelAr}
                    onChange={(e) => updateField(idx, { labelAr: e.target.value })}
                    maxLength={120}
                    dir="rtl"
                  />
                </div>
                {f.type === "SELECT" ? (
                  <div className="col-span-full">
                    <OptionsEditor
                      options={f.options ?? []}
                      onChange={(options) => updateField(idx, { options })}
                    />
                  </div>
                ) : null}
                <label className="col-span-full flex items-center gap-2 text-sm">
                  <Checkbox
                    checked={f.required}
                    onChange={(e) => updateField(idx, { required: e.target.checked })}
                  />
                  <span>{t("required")}</span>
                </label>
              </div>
            </li>
          ))}
        </ul>
      )}
    </fieldset>
  );
}

function OptionsEditor({
  options,
  onChange,
}: {
  options: { value: string; labelEn: string; labelAr: string }[];
  onChange: (next: { value: string; labelEn: string; labelAr: string }[]) => void;
}) {
  const t = useTranslations("qr.form.customFields");
  const update = (
    idx: number,
    patch: Partial<{ value: string; labelEn: string; labelAr: string }>,
  ) => onChange(options.map((o, i) => (i === idx ? { ...o, ...patch } : o)));
  const add = () =>
    onChange([...options, { value: `option_${options.length + 1}`, labelEn: "", labelAr: "" }]);
  const remove = (idx: number) => onChange(options.filter((_, i) => i !== idx));

  return (
    <div className="space-y-2 rounded-md border bg-background p-3">
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium">{t("options")}</p>
        <Button type="button" size="sm" variant="outline" onClick={add}>
          <Plus className="me-1 h-3 w-3" />
          {t("addOption")}
        </Button>
      </div>
      {options.length === 0 ? (
        <p className="text-xs text-muted-foreground">{t("noOptions")}</p>
      ) : (
        <ul className="space-y-2">
          {options.map((o, idx) => (
            <li key={idx} className="grid gap-2 md:grid-cols-[1fr_1fr_1fr_auto]">
              <Input
                value={o.value}
                onChange={(e) => update(idx, { value: e.target.value })}
                placeholder={t("optionValue")}
                maxLength={80}
              />
              <Input
                value={o.labelEn}
                onChange={(e) => update(idx, { labelEn: e.target.value })}
                placeholder={t("optionLabelEn")}
                maxLength={120}
              />
              <Input
                value={o.labelAr}
                onChange={(e) => update(idx, { labelAr: e.target.value })}
                placeholder={t("optionLabelAr")}
                maxLength={120}
                dir="rtl"
              />
              <Button
                type="button"
                size="icon"
                variant="ghost"
                onClick={() => remove(idx)}
                aria-label="Remove option"
                className="text-destructive"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
