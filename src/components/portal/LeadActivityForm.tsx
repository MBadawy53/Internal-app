"use client";

import { useActionState } from "react";
import { useTranslations } from "next-intl";
import { LeadActivityType } from "@prisma/client";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { addLeadActivityAction, type AddActivityState } from "@/server/actions/leads";

// Manual activities only — STATUS_CHANGE is auto-written by transitions.
const TYPES: LeadActivityType[] = [
  LeadActivityType.CALL,
  LeadActivityType.NOTE,
  LeadActivityType.EMAIL,
  LeadActivityType.WHATSAPP,
  LeadActivityType.SMS,
  LeadActivityType.FILE,
];

export function LeadActivityForm({ leadId }: { leadId: string }) {
  const t = useTranslations("leads.activity");
  const tType = useTranslations("leads.activityTypes");
  const [state, formAction, pending] = useActionState<AddActivityState | null, FormData>(
    addLeadActivityAction,
    null,
  );

  return (
    <form action={formAction} className="space-y-3">
      <input type="hidden" name="leadId" value={leadId} />
      <div className="grid gap-3 sm:grid-cols-[160px_1fr]">
        <div className="space-y-1.5">
          <Label htmlFor="type">{t("type")}</Label>
          <Select id="type" name="type" defaultValue={LeadActivityType.NOTE} required>
            {TYPES.map((tType_) => (
              <option key={tType_} value={tType_}>
                {tType(tType_)}
              </option>
            ))}
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="content">{t("content")}</Label>
          <Textarea id="content" name="content" rows={2} required maxLength={2000} />
        </div>
      </div>
      <Button type="submit" disabled={pending}>
        {pending ? t("adding") : t("add")}
      </Button>
      {state && state.ok === false ? (
        <p role="alert" className="text-xs text-destructive">
          {state.message}
        </p>
      ) : null}
    </form>
  );
}
