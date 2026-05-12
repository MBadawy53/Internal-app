"use client";

import { useActionState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { claimLeadAction, type ClaimLeadState } from "@/server/actions/leads";

export function ClaimLeadButton({ leadId }: { leadId: string }) {
  const t = useTranslations("leads.claim");
  const [state, formAction, pending] = useActionState<ClaimLeadState | null, FormData>(
    claimLeadAction,
    null,
  );
  return (
    <form action={formAction} className="space-y-2">
      <input type="hidden" name="leadId" value={leadId} />
      <Button type="submit" size="sm" disabled={pending}>
        {pending ? t("claiming") : t("claim")}
      </Button>
      {state && state.ok === false ? (
        <p role="alert" className="text-xs text-destructive">
          {state.message}
        </p>
      ) : null}
    </form>
  );
}
