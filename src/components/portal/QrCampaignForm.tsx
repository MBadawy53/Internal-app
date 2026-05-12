"use client";

import { useActionState, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { createCampaignAction, type CreateCampaignState } from "@/server/actions/qr";

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

interface Props {
  employees: EmployeeOption[];
  products: ProductOption[];
}

export function QrCampaignForm({ employees, products }: Props) {
  const t = useTranslations("qr.form");
  const tCommon = useTranslations("common");
  const [state, formAction, pending] = useActionState<CreateCampaignState | null, FormData>(
    createCampaignAction,
    null,
  );

  const [employeeId, setEmployeeId] = useState("");
  const selectedEmp = employees.find((e) => e.id === employeeId);
  const visibleProducts = useMemo(
    () =>
      selectedEmp?.businessLineId
        ? products.filter((p) => p.businessLineId === selectedEmp.businessLineId)
        : products,
    [products, selectedEmp],
  );

  return (
    <form action={formAction} className="grid gap-3 md:grid-cols-4">
      <div className="space-y-1.5 md:col-span-2">
        <Label htmlFor="qr-name">{t("name")}</Label>
        <Input id="qr-name" name="name" required minLength={2} maxLength={120} />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="qr-employee">{t("employee")}</Label>
        <Select
          id="qr-employee"
          name="employeeId"
          value={employeeId}
          onChange={(e) => setEmployeeId(e.target.value)}
          required
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
        <Select id="qr-product" name="productId" defaultValue="">
          <option value="">{tCommon("all")}</option>
          {visibleProducts.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </Select>
      </div>
      <div className="flex flex-wrap items-center gap-3 md:col-span-4">
        <Button type="submit" disabled={pending}>
          {pending ? tCommon("saving") : t("create")}
        </Button>
        {state && state.ok === false ? (
          <p role="alert" className="text-sm text-destructive">
            {state.message}
          </p>
        ) : null}
        {state && state.ok ? (
          <p className="text-sm text-emerald-600">{t("created", { slug: state.slug })}</p>
        ) : null}
      </div>
    </form>
  );
}
