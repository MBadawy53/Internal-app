"use client";

import { useActionState, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  createCampaignAction,
  updateCampaignAction,
  type CreateCampaignState,
  type UpdateCampaignState,
} from "@/server/actions/qr";

interface EmployeeOption {
  id: string;
  name: string;
  businessLineId?: string;
}

interface ProductOption {
  id: string;
  name: string;
  businessLineId: string;
}

export interface CampaignInitial {
  id?: string;
  name?: string;
  employeeId?: string;
  productId?: string | null;
  headerImageUrl?: string | null;
  titleEn?: string | null;
  titleAr?: string | null;
  subtitleEn?: string | null;
  subtitleAr?: string | null;
  bodyMdEn?: string | null;
  bodyMdAr?: string | null;
}

interface Props {
  employees: EmployeeOption[];
  products: ProductOption[];
  initial?: CampaignInitial;
}

export function QrCampaignForm({ employees, products, initial }: Props) {
  const t = useTranslations("qr.form");
  const tCommon = useTranslations("common");
  const isEdit = !!initial?.id;

  type AnyState = CreateCampaignState | UpdateCampaignState;
  const action = (
    isEdit ? updateCampaignAction.bind(null, initial!.id!) : createCampaignAction
  ) as (prev: AnyState | null, fd: FormData) => Promise<AnyState>;

  const [state, formAction, pending] = useActionState<AnyState | null, FormData>(action, null);

  const [employeeId, setEmployeeId] = useState(initial?.employeeId ?? "");
  const selectedEmp = employees.find((e) => e.id === employeeId);
  const visibleProducts = useMemo(
    () =>
      selectedEmp?.businessLineId
        ? products.filter((p) => p.businessLineId === selectedEmp.businessLineId)
        : products,
    [products, selectedEmp],
  );

  return (
    <form action={formAction} className="space-y-5">
      <div className="grid gap-3 md:grid-cols-4">
        <div className="space-y-1.5 md:col-span-2">
          <Label htmlFor="qr-name">{t("name")}</Label>
          <Input
            id="qr-name"
            name="name"
            required
            minLength={2}
            maxLength={120}
            defaultValue={initial?.name ?? ""}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="qr-employee">{t("employee")}</Label>
          <Select
            id="qr-employee"
            name="employeeId"
            value={employeeId}
            onChange={(e) => setEmployeeId(e.target.value)}
            required
            disabled={isEdit}
          >
            <option value="" disabled>
              —
            </option>
            {employees.map((e) => (
              <option key={e.id} value={e.id}>
                {e.name}
              </option>
            ))}
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="qr-product">{t("product")}</Label>
          <Select id="qr-product" name="productId" defaultValue={initial?.productId ?? ""}>
            <option value="">{tCommon("all")}</option>
            {visibleProducts.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </Select>
        </div>
      </div>

      <fieldset className="space-y-3 rounded-md border p-3">
        <legend className="px-1 text-sm font-medium">{t("landingSection")}</legend>

        <div className="space-y-1.5">
          <Label htmlFor="qr-header-image">{t("headerImageUrl")}</Label>
          <Input
            id="qr-header-image"
            name="headerImageUrl"
            type="url"
            placeholder="https://…"
            defaultValue={initial?.headerImageUrl ?? ""}
          />
          <p className="text-xs text-muted-foreground">{t("headerImageHint")}</p>
        </div>

        <div className="grid gap-3 md:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="qr-title-en">{t("titleEn")}</Label>
            <Input
              id="qr-title-en"
              name="titleEn"
              maxLength={120}
              defaultValue={initial?.titleEn ?? ""}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="qr-title-ar">{t("titleAr")}</Label>
            <Input
              id="qr-title-ar"
              name="titleAr"
              maxLength={120}
              dir="rtl"
              defaultValue={initial?.titleAr ?? ""}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="qr-subtitle-en">{t("subtitleEn")}</Label>
            <Input
              id="qr-subtitle-en"
              name="subtitleEn"
              maxLength={240}
              defaultValue={initial?.subtitleEn ?? ""}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="qr-subtitle-ar">{t("subtitleAr")}</Label>
            <Input
              id="qr-subtitle-ar"
              name="subtitleAr"
              maxLength={240}
              dir="rtl"
              defaultValue={initial?.subtitleAr ?? ""}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="qr-body-en">{t("bodyEn")}</Label>
            <Textarea
              id="qr-body-en"
              name="bodyMdEn"
              rows={6}
              maxLength={5000}
              defaultValue={initial?.bodyMdEn ?? ""}
            />
            <p className="text-xs text-muted-foreground">{t("bodyHint")}</p>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="qr-body-ar">{t("bodyAr")}</Label>
            <Textarea
              id="qr-body-ar"
              name="bodyMdAr"
              rows={6}
              maxLength={5000}
              dir="rtl"
              defaultValue={initial?.bodyMdAr ?? ""}
            />
          </div>
        </div>
      </fieldset>

      <div className="flex flex-wrap items-center gap-3">
        <Button type="submit" disabled={pending}>
          {pending ? tCommon("saving") : isEdit ? tCommon("save") : t("create")}
        </Button>
        {state && state.ok === false ? (
          <p role="alert" className="text-sm text-destructive">
            {state.message}
          </p>
        ) : null}
        {state && state.ok && "slug" in state ? (
          <p className="text-sm text-emerald-600">{t("created", { slug: state.slug })}</p>
        ) : null}
        {state && state.ok && !("slug" in state) ? (
          <p className="text-sm text-emerald-600">{tCommon("save")} ✓</p>
        ) : null}
      </div>
    </form>
  );
}
