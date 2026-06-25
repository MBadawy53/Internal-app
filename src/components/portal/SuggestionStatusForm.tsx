"use client";

import { useActionState } from "react";
import { useTranslations } from "next-intl";
import { SuggestionStatus } from "@prisma/client";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { updateSuggestionStatusAction, type UpdateStatusState } from "@/server/actions/suggestions";

interface Props {
  suggestionId: string;
  initial: { status: SuggestionStatus; adminResponse: string | null };
}

export function SuggestionStatusForm({ suggestionId, initial }: Props) {
  const t = useTranslations("suggestions.form");
  const tStatus = useTranslations("suggestions.statuses");
  const tCommon = useTranslations("common");

  const action = updateSuggestionStatusAction.bind(null, suggestionId);
  const [state, formAction, pending] = useActionState<UpdateStatusState, FormData>(action, null);

  return (
    <form action={formAction} className="space-y-3">
      <div className="grid gap-3 md:grid-cols-3">
        <div className="space-y-1.5">
          <Label htmlFor="ss-status">{t("status")}</Label>
          <Select id="ss-status" name="status" defaultValue={initial.status}>
            {Object.values(SuggestionStatus).map((s) => (
              <option key={s} value={s}>
                {tStatus(s)}
              </option>
            ))}
          </Select>
        </div>
        <div className="space-y-1.5 md:col-span-2">
          <Label htmlFor="ss-response">{t("response")}</Label>
          <Textarea
            id="ss-response"
            name="adminResponse"
            rows={3}
            maxLength={4000}
            defaultValue={initial.adminResponse ?? ""}
          />
          <p className="text-xs text-muted-foreground">{t("responseHint")}</p>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <Button type="submit" disabled={pending}>
          {pending ? tCommon("saving") : tCommon("save")}
        </Button>
        {state?.ok ? <p className="text-xs text-emerald-700">{tCommon("save")} ✓</p> : null}
        {state && !state.ok ? (
          <p role="alert" className="text-xs text-destructive">
            {state.message}
          </p>
        ) : null}
      </div>
    </form>
  );
}
