"use client";

import { useActionState, useMemo, useState, useTransition } from "react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import type { ProductType } from "@prisma/client";
import type { ProductAttributeKey } from "@/lib/catalog/attributes";
import { AttributeType } from "@prisma/client";
import type { AttributeSelectOption } from "@/lib/catalog/attribute-values";
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
  enabledAttributes: ProductAttributeKey[];
  requiredAttributes: ProductAttributeKey[];
  attributes: AttributeRef[];
}

export interface AttributeRef {
  id: string;
  key: string;
  nameEn: string;
  nameAr: string;
  type: AttributeType;
  options?: AttributeSelectOption[];
}

export interface AttributeValueRow {
  attributeId: string;
  value: string;
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
  minDownPaymentBps?: number;
  earlySettlementFeeBps?: number;
  latePaymentFeeBps?: number;
  heroImageUrl?: string | null;
  isFeatured?: boolean;
  isActive?: boolean;
  attributeValues?: AttributeValueRow[];
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

  const [categoryId, setCategoryId] = useState(initial?.categoryId ?? "");
  const activeCategory = useMemo(
    () => categories.find((c) => c.id === categoryId) ?? null,
    [categories, categoryId],
  );

  // Helpers: is this attribute visible/required in the active category?
  // When no category is picked yet, default to all visible (so admins can see
  // every field while filling in basics).
  const isVisible = (key: ProductAttributeKey): boolean =>
    activeCategory ? activeCategory.enabledAttributes.includes(key) : true;
  const isRequired = (key: ProductAttributeKey): boolean =>
    activeCategory ? activeCategory.requiredAttributes.includes(key) : false;

  const [heroImageUrl, setHeroImageUrl] = useState(initial?.heroImageUrl ?? "");

  // Per-product attribute values keyed by attribute ID. Initialized from
  // either the product's saved values or the category's picks.
  const [attrValues, setAttrValues] = useState<Record<string, string>>(() => {
    const map: Record<string, string> = {};
    for (const av of initial?.attributeValues ?? []) map[av.attributeId] = av.value;
    return map;
  });
  const setAttrValue = (id: string, value: string) =>
    setAttrValues((prev) => ({ ...prev, [id]: value }));
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
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
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
          {isVisible("eligibility") ? (
            <>
              <div className="space-y-1.5">
                <Label htmlFor="eligibilityEn">{tFields("eligibilityEn")}</Label>
                <Textarea
                  id="eligibilityEn"
                  name="eligibilityEn"
                  defaultValue={initial?.eligibilityEn ?? ""}
                  rows={2}
                  required={isRequired("eligibility")}
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
                  required={isRequired("eligibility")}
                />
              </div>
            </>
          ) : null}
          {isVisible("documents") ? (
            <>
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
            </>
          ) : null}
        </CardContent>
      </Card>

      {/* Loan limits — gated by amountRange + tenureRange */}
      {isVisible("amountRange") || isVisible("tenureRange") ? (
        <Card>
          <CardHeader>
            <CardTitle>{tSect("limits")}</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-4">
            {isVisible("amountRange") ? (
              <>
                <NumField
                  name="amountMinEgp"
                  label={tFields("amountMinEgp")}
                  defaultValue={initial?.amountMinEgp ?? 0}
                  required={isRequired("amountRange")}
                />
                <NumField
                  name="amountMaxEgp"
                  label={tFields("amountMaxEgp")}
                  defaultValue={initial?.amountMaxEgp ?? 0}
                  required={isRequired("amountRange")}
                />
              </>
            ) : null}
            {isVisible("tenureRange") ? (
              <>
                <NumField
                  name="tenureMinMonths"
                  label={tFields("tenureMinMonths")}
                  defaultValue={initial?.tenureMinMonths ?? 12}
                  step={1}
                  required={isRequired("tenureRange")}
                />
                <NumField
                  name="tenureMaxMonths"
                  label={tFields("tenureMaxMonths")}
                  defaultValue={initial?.tenureMaxMonths ?? 60}
                  step={1}
                  required={isRequired("tenureRange")}
                />
              </>
            ) : null}
          </CardContent>
        </Card>
      ) : null}

      {isVisible("decliningRate") ? (
        <Card>
          <CardHeader>
            <CardTitle>{tSect("rates")}</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <PercentField
              name="decliningInterestRateBps"
              label={tFields("decliningInterestRateBps")}
              defaultBps={initial?.decliningInterestRateBps ?? 0}
              required={isRequired("decliningRate")}
            />
          </CardContent>
        </Card>
      ) : null}

      {isVisible("adminFee") ? (
        <Card>
          <CardHeader>
            <CardTitle>{tSect("fees")}</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-3">
            <PercentField
              name="adminFeeBps"
              label={tFields("adminFeeBps")}
              defaultBps={initial?.adminFeeBps ?? 0}
              required={isRequired("adminFee")}
            />
            <NumField
              name="adminFeeMinEgp"
              label={tFields("adminFeeMinEgp")}
              defaultValue={initial?.adminFeeMinEgp ?? 0}
              required={isRequired("adminFee")}
            />
            <NumField
              name="adminFeeMaxEgp"
              label={tFields("adminFeeMaxEgp")}
              defaultValue={initial?.adminFeeMaxEgp ?? 0}
              required={isRequired("adminFee")}
            />
          </CardContent>
        </Card>
      ) : null}

      {isVisible("insurance") || isVisible("earlySettlement") || isVisible("latePayment") ? (
        <Card>
          <CardHeader>
            <CardTitle>{tSect("policy")}</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-3">
            {isVisible("insurance") ? (
              <label className="flex items-center gap-2 self-end pb-2 text-sm">
                <Checkbox name="insuranceRequired" defaultChecked={initial?.insuranceRequired} />
                {tFields("insuranceRequired")}
              </label>
            ) : null}
            <PercentField
              name="minDownPaymentBps"
              label={tFields("minDownPaymentBps")}
              defaultBps={initial?.minDownPaymentBps ?? 0}
            />
            {isVisible("earlySettlement") ? (
              <PercentField
                name="earlySettlementFeeBps"
                label={tFields("earlySettlementFeeBps")}
                defaultBps={initial?.earlySettlementFeeBps ?? 0}
                required={isRequired("earlySettlement")}
              />
            ) : null}
            {isVisible("latePayment") ? (
              <NumField
                name="latePaymentFeeBps"
                label={tFields("latePaymentFeeBps")}
                defaultValue={initial?.latePaymentFeeBps ?? 0}
                step={1}
                required={isRequired("latePayment")}
              />
            ) : null}
          </CardContent>
        </Card>
      ) : null}

      {/* Custom attributes — fields appear when the chosen category has attributes */}
      {activeCategory && activeCategory.attributes.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>{tSect("customAttributes")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {(() => {
              // Live-substitute the threshold amount X into the labels for the
              // two threshold-dependent insurance rate fields. X itself stays
              // editable as its own attribute; we only rewrite the label.
              const thresholdAttr = activeCategory.attributes.find(
                (a) => a.key === "insurance.threshold-amount-egp",
              );
              const xRaw = thresholdAttr ? (attrValues[thresholdAttr.id] ?? "") : "";
              const xPretty =
                xRaw && Number.isFinite(Number(xRaw))
                  ? new Intl.NumberFormat("en-EG").format(Number(xRaw))
                  : null;
              const renderLabel = (attr: AttributeRef): { en: string; ar: string } => {
                if (attr.key === "insurance.rate-under-threshold") {
                  return xPretty
                    ? {
                        en: `Insurance rate for amount under ${xPretty} EGP (%)`,
                        ar: `نسبة التأمين للمبالغ الأقل من ${xPretty} ج.م. (%)`,
                      }
                    : { en: attr.nameEn, ar: attr.nameAr };
                }
                if (attr.key === "insurance.rate-above-threshold") {
                  return xPretty
                    ? {
                        en: `Insurance rate for amount above ${xPretty} EGP (%)`,
                        ar: `نسبة التأمين للمبالغ الأكبر من ${xPretty} ج.م. (%)`,
                      }
                    : { en: attr.nameEn, ar: attr.nameAr };
                }
                return { en: attr.nameEn, ar: attr.nameAr };
              };
              return activeCategory.attributes.map((attr) => {
                const value = attrValues[attr.id] ?? "";
                const labels = renderLabel(attr);
                return (
                  <div
                    key={attr.id}
                    className="grid items-start gap-3 rounded-md border p-3 md:grid-cols-[1fr_2fr]"
                  >
                    <div>
                      <p className="text-sm font-medium">{labels.en}</p>
                      <p className="text-xs text-muted-foreground">{labels.ar}</p>
                    </div>
                    <div>
                      <input type="hidden" name="attributeId" value={attr.id} />
                      {attr.type === AttributeType.TEXT ? (
                        <Input
                          name="attributeValue"
                          value={value}
                          onChange={(e) => setAttrValue(attr.id, e.target.value)}
                        />
                      ) : null}
                      {attr.type === AttributeType.NUMBER ? (
                        <Input
                          type="number"
                          name="attributeValue"
                          value={value}
                          onChange={(e) => setAttrValue(attr.id, e.target.value)}
                        />
                      ) : null}
                      {attr.type === AttributeType.BOOLEAN ? (
                        <Select
                          name="attributeValue"
                          value={value || "false"}
                          onChange={(e) => setAttrValue(attr.id, e.target.value)}
                        >
                          <option value="true">{tCommon("yes")}</option>
                          <option value="false">{tCommon("no")}</option>
                        </Select>
                      ) : null}
                      {attr.type === AttributeType.SELECT ? (
                        <Select
                          name="attributeValue"
                          value={value}
                          onChange={(e) => setAttrValue(attr.id, e.target.value)}
                        >
                          <option value="" disabled>
                            —
                          </option>
                          {(attr.options ?? []).map((opt) => (
                            <option key={opt.value} value={opt.value}>
                              {opt.labelEn}
                            </option>
                          ))}
                        </Select>
                      ) : null}
                    </div>
                  </div>
                );
              });
            })()}
          </CardContent>
        </Card>
      ) : null}

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
  required,
}: {
  name: string;
  label: string;
  defaultValue: number | string;
  step?: number;
  help?: string;
  required?: boolean;
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={name}>
        {label}
        {required ? <span className="ms-1 text-destructive">*</span> : null}
      </Label>
      <Input
        id={name}
        name={name}
        type="number"
        defaultValue={defaultValue}
        step={step ?? "0.01"}
        required={required}
      />
      {help ? <p className="text-xs text-muted-foreground">{help}</p> : null}
    </div>
  );
}

function PercentField({
  name,
  label,
  defaultBps,
  help,
  required,
}: {
  name: string;
  label: string;
  defaultBps: number;
  help?: string;
  required?: boolean;
}) {
  const [percent, setPercent] = useState<string>(defaultBps ? (defaultBps / 100).toString() : "");
  const bps = percent === "" ? 0 : Math.round(Number(percent) * 100);
  return (
    <div className="space-y-1.5">
      <Label htmlFor={name}>
        {label}
        {required ? <span className="ms-1 text-destructive">*</span> : null}
      </Label>
      <Input
        id={name}
        type="number"
        value={percent}
        onChange={(e) => setPercent(e.target.value)}
        step="0.01"
        min={0}
        required={required}
        inputMode="decimal"
      />
      <input type="hidden" name={name} value={bps} />
      {help ? <p className="text-xs text-muted-foreground">{help}</p> : null}
    </div>
  );
}
