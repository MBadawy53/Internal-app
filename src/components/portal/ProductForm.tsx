"use client";

import { useActionState, useMemo, useState, useTransition } from "react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import type { ProductType } from "@prisma/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  createProductAction,
  updateProductAction,
  type ProductActionState,
} from "@/server/actions/products";

interface BL {
  id: string;
  name: string;
}
interface Cat {
  id: string;
  name: string;
  businessLineId: string;
}
interface Variable {
  nameEn: string;
  nameAr: string;
  descriptionEn?: string | null;
  descriptionAr?: string | null;
}

interface InitialProduct {
  id?: string;
  businessLineId?: string;
  categoryId?: string;
  type?: ProductType;
  nameEn?: string;
  nameAr?: string;
  shortDescEn?: string;
  shortDescAr?: string;
  longDescEn?: string;
  longDescAr?: string;
  eligibilityEn?: string | null;
  eligibilityAr?: string | null;
  documentsEn?: string[];
  documentsAr?: string[];
  amountMinEgp?: number;
  amountMaxEgp?: number;
  tenureMinMonths?: number;
  tenureMaxMonths?: number;
  flatInterestRateBps?: number;
  decliningInterestRateBps?: number;
  adminFeeBps?: number;
  adminFeeMinEgp?: number;
  adminFeeMaxEgp?: number;
  insuranceRequired?: boolean;
  earlySettlementFeeBps?: number;
  latePaymentFeeBps?: number;
  heroImageUrl?: string | null;
  isFeatured?: boolean;
  isActive?: boolean;
  variables?: Variable[];
}

interface Props {
  businessLines: BL[];
  categories: Cat[];
  productTypes: Array<{ value: string; label: string }>;
  initial?: InitialProduct;
}

export function ProductForm({ businessLines, categories, productTypes, initial }: Props) {
  const t = useTranslations("admin.products");
  const tFields = useTranslations("admin.products.fields");
  const tSect = useTranslations("admin.products.sections");
  const tVars = useTranslations("admin.products.variables");
  const tCommon = useTranslations("common");

  const action = initial?.id ? updateProductAction.bind(null, initial.id) : createProductAction;

  const [state, formAction, pending] = useActionState<ProductActionState | null, FormData>(
    action,
    null,
  );

  const [businessLineId, setBusinessLineId] = useState(initial?.businessLineId ?? "");
  const visibleCategories = useMemo(
    () =>
      businessLineId ? categories.filter((c) => c.businessLineId === businessLineId) : categories,
    [categories, businessLineId],
  );

  const [variables, setVariables] = useState<Variable[]>(initial?.variables ?? []);
  const [heroImageUrl, setHeroImageUrl] = useState(initial?.heroImageUrl ?? "");
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [, startTransition] = useTransition();

  const errs = state?.ok === false ? (state.fieldErrors ?? {}) : {};

  async function handleUpload(file: File) {
    setUploading(true);
    setUploadError(null);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/uploads/products", { method: "POST", body: fd });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? "upload failed");
      }
      const body = (await res.json()) as { url: string };
      setHeroImageUrl(body.url);
    } catch (err) {
      setUploadError((err as Error).message || t("uploadFailed"));
    } finally {
      setUploading(false);
    }
  }

  return (
    <form action={formAction} className="space-y-6">
      {/* Basics */}
      <Card>
        <CardHeader>
          <CardTitle>{tSect("basics")}</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-3">
          <div className="space-y-1.5">
            <Label htmlFor="businessLineId">{tFields("businessLine")}</Label>
            <Select
              id="businessLineId"
              name="businessLineId"
              value={businessLineId}
              onChange={(e) => {
                setBusinessLineId(e.target.value);
                startTransition(() => {});
              }}
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
            <Label htmlFor="categoryId">{tFields("category")}</Label>
            <Select
              id="categoryId"
              name="categoryId"
              defaultValue={initial?.categoryId ?? ""}
              required
            >
              <option value="" disabled>
                —
              </option>
              {visibleCategories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="type">{tFields("type")}</Label>
            <Select id="type" name="type" defaultValue={initial?.type ?? ""} required>
              <option value="" disabled>
                —
              </option>
              {productTypes.map((pt) => (
                <option key={pt.value} value={pt.value}>
                  {pt.label}
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
            <Input id="nameAr" name="nameAr" defaultValue={initial?.nameAr} dir="rtl" required />
          </div>
          <div className="flex items-end gap-4 pb-2">
            <label className="flex items-center gap-2 text-sm">
              <Checkbox name="isFeatured" defaultChecked={initial?.isFeatured} />
              {tFields("isFeatured")}
            </label>
            <label className="flex items-center gap-2 text-sm">
              <Checkbox name="isActive" defaultChecked={initial?.isActive ?? true} />
              {tFields("isActive")}
            </label>
          </div>
        </CardContent>
      </Card>

      {/* Descriptions */}
      <Card>
        <CardHeader>
          <CardTitle>{tSect("descriptions")}</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="shortDescEn">{tFields("shortDescEn")}</Label>
            <Textarea
              id="shortDescEn"
              name="shortDescEn"
              defaultValue={initial?.shortDescEn}
              required
              rows={2}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="shortDescAr">{tFields("shortDescAr")}</Label>
            <Textarea
              id="shortDescAr"
              name="shortDescAr"
              defaultValue={initial?.shortDescAr}
              dir="rtl"
              required
              rows={2}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="longDescEn">{tFields("longDescEn")}</Label>
            <Textarea
              id="longDescEn"
              name="longDescEn"
              defaultValue={initial?.longDescEn}
              required
              rows={4}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="longDescAr">{tFields("longDescAr")}</Label>
            <Textarea
              id="longDescAr"
              name="longDescAr"
              defaultValue={initial?.longDescAr}
              dir="rtl"
              required
              rows={4}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="eligibilityEn">{tFields("eligibilityEn")}</Label>
            <Textarea
              id="eligibilityEn"
              name="eligibilityEn"
              defaultValue={initial?.eligibilityEn ?? ""}
              rows={2}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="eligibilityAr">{tFields("eligibilityAr")}</Label>
            <Textarea
              id="eligibilityAr"
              name="eligibilityAr"
              defaultValue={initial?.eligibilityAr ?? ""}
              dir="rtl"
              rows={2}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="documentsEn">{tFields("documentsEn")}</Label>
            <Input
              id="documentsEn"
              name="_documentsEnCsv"
              defaultValue={(initial?.documentsEn ?? []).join(", ")}
              onChange={(e) => {
                // mirror into hidden multi-name fields
                const items = e.target.value
                  .split(",")
                  .map((s) => s.trim())
                  .filter(Boolean);
                const form = e.currentTarget.form;
                if (!form) return;
                form.querySelectorAll('input[name="documentsEn"]').forEach((n) => n.remove());
                for (const item of items) {
                  const i = document.createElement("input");
                  i.type = "hidden";
                  i.name = "documentsEn";
                  i.value = item;
                  form.appendChild(i);
                }
              }}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="documentsAr">{tFields("documentsAr")}</Label>
            <Input
              id="documentsAr"
              name="_documentsArCsv"
              defaultValue={(initial?.documentsAr ?? []).join(", ")}
              dir="rtl"
              onChange={(e) => {
                const items = e.target.value
                  .split(",")
                  .map((s) => s.trim())
                  .filter(Boolean);
                const form = e.currentTarget.form;
                if (!form) return;
                form.querySelectorAll('input[name="documentsAr"]').forEach((n) => n.remove());
                for (const item of items) {
                  const i = document.createElement("input");
                  i.type = "hidden";
                  i.name = "documentsAr";
                  i.value = item;
                  form.appendChild(i);
                }
              }}
            />
          </div>
          {/* Initial documents seeded as hidden inputs so the first submit also sends them */}
          {(initial?.documentsEn ?? []).map((d, i) => (
            <input key={`de-${i}`} type="hidden" name="documentsEn" value={d} />
          ))}
          {(initial?.documentsAr ?? []).map((d, i) => (
            <input key={`da-${i}`} type="hidden" name="documentsAr" value={d} />
          ))}
        </CardContent>
      </Card>

      {/* Limits + Rates + Fees + Policy */}
      <Card>
        <CardHeader>
          <CardTitle>{tSect("limits")}</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-4">
          <NumField
            name="amountMinEgp"
            label={tFields("amountMinEgp")}
            defaultValue={initial?.amountMinEgp ?? 0}
          />
          <NumField
            name="amountMaxEgp"
            label={tFields("amountMaxEgp")}
            defaultValue={initial?.amountMaxEgp ?? 0}
          />
          <NumField
            name="tenureMinMonths"
            label={tFields("tenureMinMonths")}
            defaultValue={initial?.tenureMinMonths ?? 12}
            step={1}
          />
          <NumField
            name="tenureMaxMonths"
            label={tFields("tenureMaxMonths")}
            defaultValue={initial?.tenureMaxMonths ?? 60}
            step={1}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{tSect("rates")}</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <NumField
            name="flatInterestRateBps"
            label={tFields("flatInterestRateBps")}
            defaultValue={initial?.flatInterestRateBps ?? 0}
            step={1}
            help={t("rateHelp")}
          />
          <NumField
            name="decliningInterestRateBps"
            label={tFields("decliningInterestRateBps")}
            defaultValue={initial?.decliningInterestRateBps ?? 0}
            step={1}
            help={t("rateHelp")}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{tSect("fees")}</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-3">
          <NumField
            name="adminFeeBps"
            label={tFields("adminFeeBps")}
            defaultValue={initial?.adminFeeBps ?? 0}
            step={1}
          />
          <NumField
            name="adminFeeMinEgp"
            label={tFields("adminFeeMinEgp")}
            defaultValue={initial?.adminFeeMinEgp ?? 0}
          />
          <NumField
            name="adminFeeMaxEgp"
            label={tFields("adminFeeMaxEgp")}
            defaultValue={initial?.adminFeeMaxEgp ?? 0}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{tSect("policy")}</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-3">
          <label className="flex items-center gap-2 self-end pb-2 text-sm">
            <Checkbox name="insuranceRequired" defaultChecked={initial?.insuranceRequired} />
            {tFields("insuranceRequired")}
          </label>
          <NumField
            name="earlySettlementFeeBps"
            label={tFields("earlySettlementFeeBps")}
            defaultValue={initial?.earlySettlementFeeBps ?? 0}
            step={1}
          />
          <NumField
            name="latePaymentFeeBps"
            label={tFields("latePaymentFeeBps")}
            defaultValue={initial?.latePaymentFeeBps ?? 0}
            step={1}
          />
        </CardContent>
      </Card>

      {/* Variables editor */}
      <Card>
        <CardHeader>
          <CardTitle>{tSect("variables")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <input type="hidden" name="variableCount" value={variables.length} />
          {variables.length === 0 ? (
            <p className="text-sm text-muted-foreground">{tVars("empty")}</p>
          ) : null}
          {variables.map((v, i) => (
            <div key={i} className="grid gap-3 rounded-md border p-3 md:grid-cols-2">
              <div className="space-y-1.5">
                <Label>{tVars("nameEn")}</Label>
                <Input name={`variables[${i}].nameEn`} defaultValue={v.nameEn} required />
              </div>
              <div className="space-y-1.5">
                <Label>{tVars("nameAr")}</Label>
                <Input name={`variables[${i}].nameAr`} defaultValue={v.nameAr} dir="rtl" required />
              </div>
              <div className="space-y-1.5">
                <Label>{tVars("descriptionEn")}</Label>
                <Textarea
                  name={`variables[${i}].descriptionEn`}
                  defaultValue={v.descriptionEn ?? ""}
                  rows={2}
                />
              </div>
              <div className="space-y-1.5">
                <Label>{tVars("descriptionAr")}</Label>
                <Textarea
                  name={`variables[${i}].descriptionAr`}
                  defaultValue={v.descriptionAr ?? ""}
                  dir="rtl"
                  rows={2}
                />
              </div>
              <div className="md:col-span-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setVariables(variables.filter((_, idx) => idx !== i))}
                >
                  {tVars("removeRow")}
                </Button>
              </div>
            </div>
          ))}
          <Button
            type="button"
            variant="secondary"
            onClick={() =>
              setVariables([
                ...variables,
                { nameEn: "", nameAr: "", descriptionEn: "", descriptionAr: "" },
              ])
            }
          >
            {tVars("addRow")}
          </Button>
        </CardContent>
      </Card>

      {/* Media */}
      <Card>
        <CardHeader>
          <CardTitle>{tSect("media")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <input type="hidden" name="heroImageUrl" value={heroImageUrl ?? ""} />
          {heroImageUrl ? (
            <div className="relative h-40 w-full overflow-hidden rounded-md border bg-muted">
              <Image src={heroImageUrl} alt="" fill className="object-cover" sizes="600px" />
            </div>
          ) : null}
          <div>
            <Label htmlFor="hero-upload">{t("uploadImage")}</Label>
            <input
              id="hero-upload"
              type="file"
              accept="image/png,image/jpeg,image/webp"
              disabled={uploading}
              onChange={(e) => {
                const f = e.currentTarget.files?.[0];
                if (f) void handleUpload(f);
              }}
              className="block w-full text-sm"
            />
            {uploading ? (
              <p className="mt-1 text-xs text-muted-foreground">{t("uploadingImage")}</p>
            ) : null}
            {uploadError ? <p className="mt-1 text-xs text-destructive">{uploadError}</p> : null}
          </div>
        </CardContent>
      </Card>

      {Object.keys(errs).length > 0 ? (
        <p
          role="alert"
          className="rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive"
        >
          {Object.entries(errs)
            .map(([k, v]) => `${k}: ${(v ?? []).join(", ")}`)
            .join(" · ")}
        </p>
      ) : null}

      <div className="flex gap-2">
        <Button type="submit" disabled={pending}>
          {pending ? tCommon("saving") : tCommon("save")}
        </Button>
        <Button type="button" variant="outline" asChild>
          <a href="/admin/products">{tCommon("cancel")}</a>
        </Button>
      </div>
    </form>
  );
}

function NumField({
  name,
  label,
  defaultValue,
  step,
  help,
}: {
  name: string;
  label: string;
  defaultValue: number | string;
  step?: number;
  help?: string;
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={name}>{label}</Label>
      <Input
        id={name}
        name={name}
        type="number"
        defaultValue={defaultValue}
        step={step ?? "0.01"}
      />
      {help ? <p className="text-xs text-muted-foreground">{help}</p> : null}
    </div>
  );
}
