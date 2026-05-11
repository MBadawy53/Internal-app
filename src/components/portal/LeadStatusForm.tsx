"use client";

import { useActionState, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import type { LeadStatus } from "@prisma/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { transitionLeadStatusAction, type TransitionState } from "@/server/actions/leads";
import { allowedTransitions, needsReason } from "@/lib/leads/state-machine";

interface Props {
  leadId: string;
  currentStatus: LeadStatus;
}

export function LeadStatusForm({ leadId, currentStatus }: Props) {
  const t = useTranslations("leads.status");
  const tStatus = useTranslations("leads.statuses");
  const allowed = useMemo(() => allowedTransitions(currentStatus), [currentStatus]);
  const [toStatus, setToStatus] = useState<string>("");
  const [state, formAction, pending] = useActionState<TransitionState | null, FormData>(
    transitionLeadStatusAction,
    null,
  );

  if (allowed.length === 0) {
    return <p className="text-xs text-muted-foreground">{t("terminal")}</p>;
  }

  const reasonRequired = toStatus ? needsReason(toStatus as LeadStatus) : false;

  return (
    <form action={formAction} className="space-y-3">
      <input type="hidden" name="leadId" value={leadId} />
      <div className="space-y-1.5">
        <Label htmlFor="toStatus">{t("changeTo")}</Label>
        <Select
          id="toStatus"
          name="toStatus"
          value={toStatus}
          onChange={(e) => setToStatus(e.target.value)}
          required
        >
          <option value="" disabled>
            —
          </option>
          {allowed.map((s) => (
            <option key={s} value={s}>
              {tStatus(s)}
            </option>
          ))}
        </Select>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="reason">
          {t("reason")}
          {reasonRequired ? <span className="ms-1 text-destructive">*</span> : null}
        </Label>
        <Input id="reason" name="reason" required={reasonRequired} />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="note">{t("note")}</Label>
        <Textarea id="note" name="note" rows={2} />
      </div>
      <Button type="submit" disabled={pending || !toStatus}>
        {pending ? t("updating") : t("update")}
      </Button>
      {state && state.ok === false ? (
        <p role="alert" className="text-xs text-destructive">
          {state.message}
        </p>
      ) : null}
    </form>
  );
}
