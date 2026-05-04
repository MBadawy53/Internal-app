"use client";

import { useActionState } from "react";
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
  };
}

export function CategoryForm({ businessLines, initial }: Props) {
  const tFields = useTranslations("admin.categories.fields");
  const tCommon = useTranslations("common");

  const action = initial?.id ? updateCategoryAction.bind(null, initial.id) : createCategoryAction;

  const [state, formAction, pending] = useActionState<CategoryActionState | null, FormData>(
    action,
    null,
  );

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
