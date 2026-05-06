"use client";

import { useActionState, useState } from "react";
import { useTranslations } from "next-intl";
import { AttributeType } from "@prisma/client";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  createAttributeAction,
  updateAttributeAction,
  type AttributeActionState,
} from "@/server/actions/attributes";

interface SelectOption {
  value: string;
  labelEn: string;
  labelAr: string;
}

interface Props {
  initial?: {
    id?: string;
    key?: string;
    nameEn?: string;
    nameAr?: string;
    helpEn?: string | null;
    helpAr?: string | null;
    type?: AttributeType;
    options?: SelectOption[];
    sortOrder?: number;
    isActive?: boolean;
  };
}

export function AttributeForm({ initial }: Props) {
  const t = useTranslations("admin.attributes.fields");
  const tCommon = useTranslations("common");
  const tTypes = useTranslations("admin.attributes.types");

  const action = initial?.id ? updateAttributeAction.bind(null, initial.id) : createAttributeAction;
  const [state, formAction, pending] = useActionState<AttributeActionState | null, FormData>(
    action,
    null,
  );

  const [type, setType] = useState<AttributeType>(initial?.type ?? AttributeType.TEXT);
  const [options, setOptions] = useState<SelectOption[]>(initial?.options ?? []);

  const errs = state?.ok === false ? (state.fieldErrors ?? {}) : {};

  return (
    <form action={formAction} className="space-y-5">
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="key">{t("key")}</Label>
          <Input
            id="key"
            name="key"
            defaultValue={initial?.key}
            required
            pattern="[a-z0-9]+(?:-[a-z0-9]+)*"
          />
          <p className="text-xs text-muted-foreground">{t("keyHelp")}</p>
          {errs.key ? <p className="text-xs text-destructive">{errs.key.join(", ")}</p> : null}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="type">{t("type")}</Label>
          <Select
            id="type"
            name="type"
            value={type}
            onChange={(e) => setType(e.target.value as AttributeType)}
            required
          >
            {Object.values(AttributeType).map((t) => (
              <option key={t} value={t}>
                {tTypes(t)}
              </option>
            ))}
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="nameEn">{t("nameEn")}</Label>
          <Input id="nameEn" name="nameEn" defaultValue={initial?.nameEn} required />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="nameAr">{t("nameAr")}</Label>
          <Input id="nameAr" name="nameAr" defaultValue={initial?.nameAr} dir="rtl" required />
        </div>
        <div className="space-y-1.5 md:col-span-2">
          <Label htmlFor="helpEn">{t("helpEn")}</Label>
          <Textarea id="helpEn" name="helpEn" defaultValue={initial?.helpEn ?? ""} rows={2} />
        </div>
        <div className="space-y-1.5 md:col-span-2">
          <Label htmlFor="helpAr">{t("helpAr")}</Label>
          <Textarea
            id="helpAr"
            name="helpAr"
            defaultValue={initial?.helpAr ?? ""}
            dir="rtl"
            rows={2}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="sortOrder">{t("sortOrder")}</Label>
          <Input
            id="sortOrder"
            name="sortOrder"
            type="number"
            min={0}
            defaultValue={initial?.sortOrder ?? 0}
          />
        </div>
        <div className="flex items-center gap-2 self-end pb-2">
          <Checkbox id="isActive" name="isActive" defaultChecked={initial?.isActive ?? true} />
          <Label htmlFor="isActive">{t("isActive")}</Label>
        </div>
      </div>

      {type === AttributeType.SELECT ? (
        <fieldset className="rounded-md border p-4">
          <legend className="px-1 text-sm font-medium">{t("optionsTitle")}</legend>
          <p className="mb-3 text-xs text-muted-foreground">{t("optionsHelp")}</p>
          <div className="space-y-2">
            {options.length === 0 ? (
              <p className="text-sm text-muted-foreground">{t("optionsEmpty")}</p>
            ) : null}
            {options.map((opt, i) => (
              <div key={i} className="grid gap-2 rounded-md border p-3 md:grid-cols-3">
                <div className="space-y-1">
                  <Label>{t("optionValue")}</Label>
                  <Input
                    name="optionValue"
                    defaultValue={opt.value}
                    pattern="[a-z0-9]+(?:-[a-z0-9]+)*"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <Label>{t("optionLabelEn")}</Label>
                  <Input name="optionLabelEn" defaultValue={opt.labelEn} required />
                </div>
                <div className="space-y-1">
                  <Label>{t("optionLabelAr")}</Label>
                  <Input name="optionLabelAr" defaultValue={opt.labelAr} dir="rtl" required />
                </div>
                <div className="md:col-span-3">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setOptions(options.filter((_, idx) => idx !== i))}
                  >
                    {t("optionRemove")}
                  </Button>
                </div>
              </div>
            ))}
            <Button
              type="button"
              variant="secondary"
              onClick={() => setOptions([...options, { value: "", labelEn: "", labelAr: "" }])}
            >
              {t("optionAdd")}
            </Button>
          </div>
        </fieldset>
      ) : null}

      {state?.ok === false && state.message ? (
        <p role="alert" className="text-sm text-destructive">
          {state.message}
        </p>
      ) : null}

      <div className="flex gap-2">
        <Button type="submit" disabled={pending}>
          {pending ? tCommon("saving") : tCommon("save")}
        </Button>
        <Button type="button" variant="outline" asChild>
          <a href="/admin/attributes">{tCommon("cancel")}</a>
        </Button>
      </div>
    </form>
  );
}
