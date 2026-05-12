"use client";

import { useActionState, useMemo, useState } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { createLeadAction, type CreateLeadState } from "@/server/actions/leads";

interface Option {
  id: string;
  name: string;
  businessLineId?: string;
}

interface Props {
  businessLines: Option[];
  products: Option[];
  owners: Option[];
  showOwnerPicker: boolean;
  initial?: {
    businessLineId?: string;
    productId?: string;
    customerNote?: string;
  };
}

export function LeadForm({ businessLines, products, owners, showOwnerPicker, initial }: Props) {
  const t = useTranslations("leads.form");
  const tCommon = useTranslations("common");
  const [state, formAction, pending] = useActionState<CreateLeadState | null, FormData>(
    createLeadAction,
    null,
  );

  const [businessLineId, setBusinessLineId] = useState(initial?.businessLineId ?? "");
  const visibleProducts = useMemo(
    () => (businessLineId ? products.filter((p) => p.businessLineId === businessLineId) : products),
    [businessLineId, products],
  );
  const visibleOwners = useMemo(
    () => (businessLineId ? owners.filter((o) => o.businessLineId === businessLineId) : owners),
    [businessLineId, owners],
  );

  return (
    <form action={formAction} className="space-y-5">
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="customerName">{t("customerName")}</Label>
          <Input id="customerName" name="customerName" required maxLength={160} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="customerPhone">{t("customerPhone")}</Label>
          <Input id="customerPhone" name="customerPhone" required type="tel" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="customerEmail">{t("customerEmail")}</Label>
          <Input id="customerEmail" name="customerEmail" type="email" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="nationalId">{t("nationalId")}</Label>
          <Input id="nationalId" name="nationalId" maxLength={20} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="businessLineId">{t("businessLine")}</Label>
          <Select
            id="businessLineId"
            name="businessLineId"
            value={businessLineId}
            onChange={(e) => setBusinessLineId(e.target.value)}
            required
          >
            <option value="" disabled>
              —
            </option>
            {businessLines.map((bl) => (
              <option key={bl.id} value={bl.id}>
                {bl.name}
              </option>
            ))}
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="productId">{t("product")}</Label>
          <Select id="productId" name="productId" defaultValue={initial?.productId ?? ""}>
            <option value="">{tCommon("all")}</option>
            {visibleProducts.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </Select>
        </div>
        {showOwnerPicker ? (
          <div className="space-y-1.5">
            <Label htmlFor="ownerEmployeeId">{t("owner")}</Label>
            <Select id="ownerEmployeeId" name="ownerEmployeeId" required>
              <option value="" disabled>
                —
              </option>
              {visibleOwners.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.name}
                </option>
              ))}
            </Select>
          </div>
        ) : null}
        <div className="space-y-1.5">
          <Label htmlFor="preferredContactTime">{t("preferredContactTime")}</Label>
          <Input id="preferredContactTime" name="preferredContactTime" maxLength={120} />
        </div>
        <div className="space-y-1.5 md:col-span-2">
          <Label htmlFor="customerNote">{t("customerNote")}</Label>
          <Textarea
            id="customerNote"
            name="customerNote"
            rows={3}
            maxLength={2000}
            defaultValue={initial?.customerNote ?? ""}
          />
        </div>
      </div>

      <label className="flex items-start gap-2 rounded-md border bg-secondary/30 p-3 text-sm">
        <Checkbox name="consentGiven" required />
        <span>{t("consent")}</span>
      </label>

      <div className="flex gap-2">
        <Button type="submit" disabled={pending}>
          {pending ? tCommon("saving") : tCommon("create")}
        </Button>
        <Button type="button" variant="outline" asChild>
          <Link href="/leads">{tCommon("cancel")}</Link>
        </Button>
      </div>

      {state && state.ok === false ? (
        <p role="alert" className="text-sm text-destructive">
          {state.message}
        </p>
      ) : null}
    </form>
  );
}
