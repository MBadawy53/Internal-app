"use client";

import { useActionState, useState } from "react";
import { useTranslations } from "next-intl";
import type { CommissionPersona } from "@prisma/client";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { saveCommissionAction, type SaveCommissionState } from "@/server/actions/commissions";

interface TierRow {
  fromEgp: number | "";
  toEgp: number | "" | null;
  valueType: "percent" | "flat";
  valueAmount: number | "";
  label: string;
}

interface Props {
  productId: string;
  persona: CommissionPersona;
  initialIsActive: boolean;
  initialNotes: string;
  initialTiers: Array<{
    fromEgp: number;
    toEgp: number | null;
    valueType: "percent" | "flat";
    valueAmount: number;
    label: string;
  }>;
}

const EMPTY_ROW: TierRow = {
  fromEgp: "",
  toEgp: "",
  valueType: "percent",
  valueAmount: "",
  label: "",
};

export function CommissionEditor({
  productId,
  persona,
  initialIsActive,
  initialNotes,
  initialTiers,
}: Props) {
  const t = useTranslations("admin.commission.editor");
  const tCommon = useTranslations("common");
  const [tiers, setTiers] = useState<TierRow[]>(
    initialTiers.length > 0 ? initialTiers : [EMPTY_ROW],
  );
  const [state, formAction, pending] = useActionState<SaveCommissionState | null, FormData>(
    saveCommissionAction,
    null,
  );

  function updateRow(i: number, patch: Partial<TierRow>) {
    setTiers((prev) => prev.map((r, idx) => (idx === i ? { ...r, ...patch } : r)));
  }
  function removeRow(i: number) {
    setTiers((prev) => prev.filter((_, idx) => idx !== i));
  }
  function addRow() {
    setTiers((prev) => [...prev, { ...EMPTY_ROW }]);
  }

  return (
    <form action={formAction} className="space-y-5">
      <input type="hidden" name="productId" value={productId} />
      <input type="hidden" name="persona" value={persona} />

      <div className="flex flex-wrap items-center gap-4">
        <label className="flex items-center gap-2 text-sm">
          <Checkbox name="isActive" defaultChecked={initialIsActive} />
          <span>{t("isActive")}</span>
        </label>
      </div>

      <div className="overflow-x-auto rounded-md border">
        <table className="w-full text-sm">
          <thead className="border-b bg-muted/30 text-xs uppercase tracking-wider text-muted-foreground">
            <tr>
              <th className="px-3 py-2 text-start">{t("from")}</th>
              <th className="px-3 py-2 text-start">{t("to")}</th>
              <th className="px-3 py-2 text-start">{t("valueType")}</th>
              <th className="px-3 py-2 text-start">{t("valueAmount")}</th>
              <th className="px-3 py-2 text-start">{t("label")}</th>
              <th className="px-3 py-2 text-start" />
            </tr>
          </thead>
          <tbody>
            {tiers.map((row, i) => (
              <tr key={i} className="border-b last:border-b-0">
                <td className="px-3 py-2">
                  <Input
                    type="number"
                    inputMode="decimal"
                    min={0}
                    step="0.01"
                    name="tier.from"
                    value={row.fromEgp}
                    onChange={(e) =>
                      updateRow(i, {
                        fromEgp: e.target.value === "" ? "" : Number(e.target.value),
                      })
                    }
                  />
                </td>
                <td className="px-3 py-2">
                  <Input
                    type="number"
                    inputMode="decimal"
                    min={0}
                    step="0.01"
                    name="tier.to"
                    placeholder={t("openEnded")}
                    value={row.toEgp ?? ""}
                    onChange={(e) =>
                      updateRow(i, {
                        toEgp: e.target.value === "" ? "" : Number(e.target.value),
                      })
                    }
                  />
                </td>
                <td className="px-3 py-2">
                  <Select
                    name="tier.valueType"
                    value={row.valueType}
                    onChange={(e) =>
                      updateRow(i, { valueType: e.target.value as "percent" | "flat" })
                    }
                  >
                    <option value="percent">{t("percent")}</option>
                    <option value="flat">{t("flat")}</option>
                  </Select>
                </td>
                <td className="px-3 py-2">
                  <Input
                    type="number"
                    inputMode="decimal"
                    min={0}
                    step="0.01"
                    name="tier.valueAmount"
                    value={row.valueAmount}
                    onChange={(e) =>
                      updateRow(i, {
                        valueAmount: e.target.value === "" ? "" : Number(e.target.value),
                      })
                    }
                  />
                </td>
                <td className="px-3 py-2">
                  <Input
                    type="text"
                    maxLength={120}
                    name="tier.label"
                    value={row.label}
                    onChange={(e) => updateRow(i, { label: e.target.value })}
                  />
                </td>
                <td className="px-3 py-2">
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    onClick={() => removeRow(i)}
                    disabled={tiers.length <= 1}
                  >
                    {t("remove")}
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Button type="button" size="sm" variant="outline" onClick={addRow}>
        + {t("addRow")}
      </Button>

      <div className="space-y-1.5">
        <Label htmlFor="commission-notes">{t("notes")}</Label>
        <Textarea
          id="commission-notes"
          name="notes"
          rows={3}
          maxLength={2000}
          defaultValue={initialNotes}
        />
      </div>

      <div className="flex items-center gap-3">
        <Button type="submit" disabled={pending}>
          {pending ? tCommon("saving") : tCommon("save")}
        </Button>
        {state && state.ok === false ? (
          <p role="alert" className="text-sm text-destructive">
            {state.message}
          </p>
        ) : null}
        {state && state.ok ? <p className="text-sm text-emerald-600">{tCommon("save")} ✓</p> : null}
      </div>
    </form>
  );
}
