"use client";

import { useActionState, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { LeadProductStatus, LeadTrack, type LeadAppStatus } from "@prisma/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MoneyInput } from "@/components/ui/money-input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { transitionLeadStateAction, type TransitionStateState } from "@/server/actions/leads";
import { allowedStates, needsReasonForState } from "@/lib/leads/state-machine";

interface Props {
  leadId: string;
  appStatus: LeadAppStatus;
  productStatus: LeadProductStatus;
  track: LeadTrack | null;
}

export function LeadStatusForm({ leadId, appStatus, productStatus, track }: Props) {
  const t = useTranslations("leads.status");
  const tApp = useTranslations("leads.appStatuses");
  const tProd = useTranslations("leads.productStatuses");
  const tTrack = useTranslations("leads.tracks");

  const next = useMemo(
    () => allowedStates({ appStatus, productStatus }),
    [appStatus, productStatus],
  );

  // Each option is the pair "appStatus|productStatus".
  const [pair, setPair] = useState<string>("");
  const [state, formAction, pending] = useActionState<TransitionStateState | null, FormData>(
    transitionLeadStateAction,
    null,
  );

  if (next.length === 0) {
    return <p className="text-xs text-muted-foreground">{t("terminal")}</p>;
  }

  const [toAppStatus, toProductStatus] = pair
    ? (pair.split("|") as [LeadAppStatus, LeadProductStatus])
    : [undefined, undefined];
  const reasonRequired =
    toAppStatus && toProductStatus
      ? needsReasonForState({ appStatus: toAppStatus, productStatus: toProductStatus })
      : false;
  const contractClosing = toProductStatus === LeadProductStatus.CONTRACT;

  return (
    <form action={formAction} className="space-y-3">
      <input type="hidden" name="leadId" value={leadId} />
      {toAppStatus ? <input type="hidden" name="toAppStatus" value={toAppStatus} /> : null}
      {toProductStatus ? (
        <input type="hidden" name="toProductStatus" value={toProductStatus} />
      ) : null}

      <div className="space-y-1.5">
        <Label htmlFor="toPair">{t("changeTo")}</Label>
        <Select id="toPair" value={pair} onChange={(e) => setPair(e.target.value)} required>
          <option value="" disabled>
            —
          </option>
          {next.map((s) => (
            <option
              key={`${s.appStatus}|${s.productStatus}`}
              value={`${s.appStatus}|${s.productStatus}`}
            >
              55 {tApp(s.appStatus)} · 99 {tProd(s.productStatus)}
            </option>
          ))}
        </Select>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="toTrack">{t("track")}</Label>
        <Select id="toTrack" name="toTrack" defaultValue={track ?? ""}>
          <option value="">{t("trackUnset")}</option>
          {Object.values(LeadTrack).map((tr) => (
            <option key={tr} value={tr}>
              {tTrack(tr)}
            </option>
          ))}
        </Select>
      </div>

      {contractClosing ? (
        <div className="space-y-1.5">
          <Label htmlFor="finalLoanAmountEgp">
            {t("finalLoanAmount")}
            <span className="ms-1 text-destructive">*</span>
          </Label>
          <MoneyInput id="finalLoanAmountEgp" name="finalLoanAmountEgp" required />
          <p className="text-xs text-muted-foreground">{t("finalLoanAmountHint")}</p>
        </div>
      ) : null}

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

      <Button type="submit" disabled={pending || !pair}>
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
