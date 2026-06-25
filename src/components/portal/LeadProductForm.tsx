"use client";

import { useActionState, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { updateLeadProductAction, type UpdateLeadProductState } from "@/server/actions/leads";

interface BL {
  id: string;
  name: string;
}
interface Product {
  id: string;
  name: string;
  businessLineId: string;
}

interface Props {
  leadId: string;
  businessLineId: string | null;
  productId: string | null;
  businessLines: BL[];
  products: Product[];
}

export function LeadProductForm({
  leadId,
  businessLineId,
  productId,
  businessLines,
  products,
}: Props) {
  const t = useTranslations("leads.productEdit");
  const tCommon = useTranslations("common");

  const [bl, setBl] = useState(businessLineId ?? "");
  const [pid, setPid] = useState(productId ?? "");

  const visibleProducts = useMemo(
    () => products.filter((p) => p.businessLineId === bl),
    [products, bl],
  );

  const [state, formAction, pending] = useActionState<UpdateLeadProductState | null, FormData>(
    updateLeadProductAction,
    null,
  );

  return (
    <form action={formAction} className="space-y-3">
      <input type="hidden" name="leadId" value={leadId} />
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="lp-bl">{t("businessLine")}</Label>
          <Select
            id="lp-bl"
            name="businessLineId"
            value={bl}
            onChange={(e) => {
              setBl(e.target.value);
              setPid("");
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
          <Label htmlFor="lp-product">{t("product")}</Label>
          <Select
            id="lp-product"
            name="productId"
            value={pid}
            onChange={(e) => setPid(e.target.value)}
          >
            <option value="">{t("noProduct")}</option>
            {visibleProducts.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </Select>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Button type="submit" size="sm" disabled={pending}>
          {pending ? tCommon("saving") : tCommon("save")}
        </Button>
        {state?.ok ? (
          <span className="text-xs text-emerald-700">{t("saved")}</span>
        ) : state && state.ok === false ? (
          <span role="alert" className="text-xs text-destructive">
            {state.message}
          </span>
        ) : null}
      </div>
    </form>
  );
}
