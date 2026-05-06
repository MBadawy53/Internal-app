"use client";

import { useActionState, useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  createCategoryAction,
  updateCategoryAction,
  type CategoryActionState,
} from "@/server/actions/categories";
import { PRODUCT_ATTRIBUTE_KEYS, type ProductAttributeKey } from "@/lib/catalog/attributes";

interface BL {
  id: string;
  name: string;
}

interface Props {
  businessLines: BL[];
  initial?: {
    id?: string;
    slug?: string;
    businessLineId?: string;
    nameEn?: string;
    nameAr?: string;
    descriptionEn?: string | null;
    descriptionAr?: string | null;
    sortOrder?: number;
    isActive?: boolean;
    enabledAttributes?: string[];
    requiredAttributes?: string[];
  };
}

export function CategoryForm({ businessLines, initial }: Props) {
  const tFields = useTranslations("admin.categories.fields");
  const tCommon = useTranslations("common");
  const tAttrs = useTranslations("admin.categories.attributes");

  const action = initial?.id ? updateCategoryAction.bind(null, initial.id) : createCategoryAction;

  const [state, formAction, pending] = useActionState<CategoryActionState | null, FormData>(
    action,
    null,
  );

  // Default to all enabled + all required when creating fresh — matches the
  // schema default and "categories work like before" expectation.
  const initialEnabled = new Set<ProductAttributeKey>(
    (initial?.enabledAttributes as ProductAttributeKey[] | undefined) ?? PRODUCT_ATTRIBUTE_KEYS,
  );
  const initialRequired = new Set<ProductAttributeKey>(
    (initial?.requiredAttributes as ProductAttributeKey[] | undefined) ?? PRODUCT_ATTRIBUTE_KEYS,
  );

  const [enabled, setEnabled] = useState<Set<ProductAttributeKey>>(initialEnabled);
  const [required, setRequired] = useState<Set<ProductAttributeKey>>(initialRequired);

  const toggleEnabled = (key: ProductAttributeKey) => {
    setEnabled((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
        // Disabling an attribute also un-requires it.
        setRequired((req) => {
          const r = new Set(req);
          r.delete(key);
          return r;
        });
      } else {
        next.add(key);
      }
      return next;
    });
  };

  const toggleRequired = (key: ProductAttributeKey) => {
    setRequired((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else {
        next.add(key);
        // Requiring an attribute also enables it.
        setEnabled((en) => new Set(en).add(key));
      }
      return next;
    });
  };

  const errs = state?.ok === false ? (state.fieldErrors ?? {}) : {};

  return (
    <form action={formAction} className="space-y-5">
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="slug">{tFields("slug")}</Label>
          <Input id="slug" name="slug" defaultValue={initial?.slug} required />
          {errs.slug ? <p className="text-xs text-destructive">{errs.slug.join(", ")}</p> : null}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="businessLineId">{tFields("businessLine")}</Label>
          <Select
            id="businessLineId"
            name="businessLineId"
            defaultValue={initial?.businessLineId ?? ""}
            required
          >
            <option value="" disabled>
              —
            </option>
            {businessLines.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="nameEn">{tFields("nameEn")}</Label>
          <Input id="nameEn" name="nameEn" defaultValue={initial?.nameEn} required />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="nameAr">{tFields("nameAr")}</Label>
          <Input id="nameAr" name="nameAr" defaultValue={initial?.nameAr} required dir="rtl" />
        </div>
        <div className="space-y-1.5 md:col-span-2">
          <Label htmlFor="descriptionEn">{tFields("descriptionEn")}</Label>
          <Textarea
            id="descriptionEn"
            name="descriptionEn"
            defaultValue={initial?.descriptionEn ?? ""}
            rows={2}
          />
        </div>
        <div className="space-y-1.5 md:col-span-2">
          <Label htmlFor="descriptionAr">{tFields("descriptionAr")}</Label>
          <Textarea
            id="descriptionAr"
            name="descriptionAr"
            defaultValue={initial?.descriptionAr ?? ""}
            rows={2}
            dir="rtl"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="sortOrder">{tFields("sortOrder")}</Label>
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
          <Label htmlFor="isActive">{tFields("isActive")}</Label>
        </div>
      </div>

      {/* Per-category product attribute config — Q1=a, Q2=b */}
      <fieldset className="rounded-md border p-4">
        <legend className="px-1 text-sm font-medium">{tAttrs("title")}</legend>
        <p className="mb-3 text-xs text-muted-foreground">{tAttrs("help")}</p>

        <div className="overflow-hidden rounded-md border">
          <table className="w-full text-sm">
            <thead className="border-b bg-secondary/40">
              <tr className="text-left text-xs uppercase tracking-wider text-muted-foreground">
                <th className="px-3 py-2">{tAttrs("attribute")}</th>
                <th className="px-3 py-2 text-center">{tAttrs("visible")}</th>
                <th className="px-3 py-2 text-center">{tAttrs("required")}</th>
              </tr>
            </thead>
            <tbody>
              {PRODUCT_ATTRIBUTE_KEYS.map((key) => {
                const isEnabled = enabled.has(key);
                const isRequired = required.has(key);
                return (
                  <tr key={key} className="border-b last:border-0">
                    <td className="px-3 py-2 font-medium">{tAttrs(`labels.${key}`)}</td>
                    <td className="px-3 py-2 text-center">
                      <Checkbox
                        checked={isEnabled}
                        onChange={() => toggleEnabled(key)}
                        aria-label={`${tAttrs(`labels.${key}`)} ${tAttrs("visible")}`}
                      />
                      {isEnabled ? (
                        <input type="hidden" name="enabledAttributes" value={key} />
                      ) : null}
                    </td>
                    <td className="px-3 py-2 text-center">
                      <Checkbox
                        checked={isRequired}
                        onChange={() => toggleRequired(key)}
                        aria-label={`${tAttrs(`labels.${key}`)} ${tAttrs("required")}`}
                      />
                      {isRequired ? (
                        <input type="hidden" name="requiredAttributes" value={key} />
                      ) : null}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </fieldset>

      <div className="flex gap-2">
        <Button type="submit" disabled={pending}>
          {pending ? tCommon("saving") : tCommon("save")}
        </Button>
        <Button type="button" variant="outline" asChild>
          <a href="/admin/categories">{tCommon("cancel")}</a>
        </Button>
      </div>

      {state?.ok === false && state.message ? (
        <p role="alert" className="text-sm text-destructive">
          {state.message}
        </p>
      ) : null}
    </form>
  );
}
