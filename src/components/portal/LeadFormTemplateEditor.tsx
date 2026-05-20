"use client";

import { useActionState, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { ArrowDown, ArrowUp, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import {
  createLeadFormTemplateAction,
  updateLeadFormTemplateAction,
  type SaveTemplateState,
} from "@/server/actions/leadFormTemplates";
import {
  LEAD_FORM_FIELD_TYPES,
  type LeadFormField,
  type LeadFormFieldType,
} from "@/lib/leadForm/types";

interface InitialState {
  name: string;
  isDefault: boolean;
  isActive: boolean;
  fields: LeadFormField[];
}

interface Props {
  mode: "create" | "edit";
  templateId?: string;
  initial?: InitialState;
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

export function LeadFormTemplateEditor({ mode, templateId, initial }: Props) {
  const t = useTranslations("admin.leadForm.editor");
  const tCommon = useTranslations("common");
  const router = useRouter();

  const [name, setName] = useState(initial?.name ?? "");
  const [isDefault, setIsDefault] = useState(initial?.isDefault ?? false);
  const [isActive, setIsActive] = useState(initial?.isActive ?? true);
  const [fields, setFields] = useState<LeadFormField[]>(initial?.fields ?? []);

  const boundAction = useMemo(
    () =>
      mode === "edit" && templateId
        ? updateLeadFormTemplateAction.bind(null, templateId)
        : createLeadFormTemplateAction,
    [mode, templateId],
  );
  const [state, formAction, pending] = useActionState<SaveTemplateState, FormData>(
    boundAction,
    null,
  );

  if (state?.ok && mode === "create") {
    router.push(`/admin/lead-form/${state.id}`);
  }

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

  return (
    <form
      action={formAction}
      className="space-y-6"
      onSubmit={() => {
        // The action also re-validates server-side.
      }}
    >
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="tpl-name">{t("name")}</Label>
          <Input
            id="tpl-name"
            name="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            minLength={2}
            maxLength={80}
          />
        </div>
        <div className="flex items-end gap-4 pb-1">
          <label className="flex items-center gap-2 text-sm">
            <Checkbox
              name="isDefault"
              checked={isDefault}
              onChange={(e) => setIsDefault(e.target.checked)}
            />
            <span>{t("isDefault")}</span>
          </label>
          {mode === "edit" ? (
            <label className="flex items-center gap-2 text-sm">
              <Checkbox
                name="isActive"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
              />
              <span>{t("isActive")}</span>
            </label>
          ) : null}
        </div>
      </div>

      <input type="hidden" name="fields" value={JSON.stringify(fields)} />

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-medium">{t("fieldsTitle")}</h2>
          <Button type="button" size="sm" variant="outline" onClick={add}>
            <Plus className="me-1 h-4 w-4" />
            {t("addField")}
          </Button>
        </div>

        {fields.length === 0 ? (
          <p className="rounded-md border border-dashed p-6 text-center text-xs text-muted-foreground">
            {t("noFields")}
          </p>
        ) : (
          <ul className="space-y-3">
            {fields.map((f, idx) => (
              <FieldRow
                key={`${f.id}-${idx}`}
                field={f}
                onChange={(patch) => updateField(idx, patch)}
                onMoveUp={() => move(idx, -1)}
                onMoveDown={() => move(idx, 1)}
                onRemove={() => remove(idx)}
                isFirst={idx === 0}
                isLast={idx === fields.length - 1}
              />
            ))}
          </ul>
        )}
      </section>

      {state && !state.ok ? (
        <p role="alert" className="text-sm text-destructive">
          {state.message}
        </p>
      ) : null}

      <div className="flex gap-2">
        <Button type="submit" disabled={pending}>
          {pending ? tCommon("saving") : tCommon("save")}
        </Button>
        <Button type="button" variant="outline" asChild>
          <Link href="/admin/lead-form">{tCommon("cancel")}</Link>
        </Button>
      </div>
    </form>
  );
}

function FieldRow({
  field,
  onChange,
  onMoveUp,
  onMoveDown,
  onRemove,
  isFirst,
  isLast,
}: {
  field: LeadFormField;
  onChange: (patch: Partial<LeadFormField>) => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onRemove: () => void;
  isFirst: boolean;
  isLast: boolean;
}) {
  const t = useTranslations("admin.leadForm.editor");
  const tType = useTranslations("admin.leadForm.types");

  return (
    <li className="rounded-md border bg-secondary/30 p-3">
      <div className="flex items-start justify-between gap-2">
        <p className="font-mono text-xs text-muted-foreground">{field.id}</p>
        <div className="flex gap-1">
          <Button
            type="button"
            size="icon"
            variant="ghost"
            onClick={onMoveUp}
            disabled={isFirst}
            aria-label="Move up"
          >
            <ArrowUp className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            size="icon"
            variant="ghost"
            onClick={onMoveDown}
            disabled={isLast}
            aria-label="Move down"
          >
            <ArrowDown className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            size="icon"
            variant="ghost"
            onClick={onRemove}
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
            value={field.id}
            onChange={(e) =>
              onChange({ id: e.target.value.toLowerCase().replace(/[^a-z0-9_]/gu, "_") })
            }
            maxLength={64}
            spellCheck={false}
          />
        </div>
        <div className="space-y-1.5">
          <Label>{t("fieldType")}</Label>
          <Select
            value={field.type}
            onChange={(e) => onChange({ type: e.target.value as LeadFormFieldType })}
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
            value={field.labelEn}
            onChange={(e) => onChange({ labelEn: e.target.value })}
            maxLength={120}
          />
        </div>
        <div className="space-y-1.5">
          <Label>{t("labelAr")}</Label>
          <Input
            value={field.labelAr}
            onChange={(e) => onChange({ labelAr: e.target.value })}
            maxLength={120}
          />
        </div>
        <div className="space-y-1.5">
          <Label>{t("placeholderEn")}</Label>
          <Input
            value={field.placeholderEn ?? ""}
            onChange={(e) => onChange({ placeholderEn: e.target.value || undefined })}
            maxLength={160}
          />
        </div>
        <div className="space-y-1.5">
          <Label>{t("placeholderAr")}</Label>
          <Input
            value={field.placeholderAr ?? ""}
            onChange={(e) => onChange({ placeholderAr: e.target.value || undefined })}
            maxLength={160}
          />
        </div>
        {field.type === "NUMBER" ? (
          <>
            <div className="space-y-1.5">
              <Label>{t("min")}</Label>
              <Input
                type="number"
                value={field.min ?? ""}
                onChange={(e) =>
                  onChange({ min: e.target.value === "" ? undefined : Number(e.target.value) })
                }
              />
            </div>
            <div className="space-y-1.5">
              <Label>{t("max")}</Label>
              <Input
                type="number"
                value={field.max ?? ""}
                onChange={(e) =>
                  onChange({ max: e.target.value === "" ? undefined : Number(e.target.value) })
                }
              />
            </div>
          </>
        ) : null}
        {field.type === "SELECT" ? (
          <div className="col-span-full">
            <SelectOptionsEditor
              options={field.options ?? []}
              onChange={(options) => onChange({ options })}
            />
          </div>
        ) : null}
        <label className="col-span-full flex items-center gap-2 text-sm">
          <Checkbox
            checked={field.required}
            onChange={(e) => onChange({ required: e.target.checked })}
          />
          <span>{t("required")}</span>
        </label>
      </div>
    </li>
  );
}

function SelectOptionsEditor({
  options,
  onChange,
}: {
  options: { value: string; labelEn: string; labelAr: string }[];
  onChange: (next: { value: string; labelEn: string; labelAr: string }[]) => void;
}) {
  const t = useTranslations("admin.leadForm.editor");
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
