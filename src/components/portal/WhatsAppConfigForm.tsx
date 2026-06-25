"use client";

import { useActionState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { saveWhatsAppConfigAction, type SaveConfigState } from "@/server/actions/integrationConfig";

interface Props {
  initial: {
    isEnabled: boolean;
    hasAccessToken: boolean;
    phoneNumberId: string;
    businessAccountId: string;
  };
}

export function WhatsAppConfigForm({ initial }: Props) {
  const t = useTranslations("configuration.whatsapp");
  const tCommon = useTranslations("common");
  const [state, formAction, pending] = useActionState<SaveConfigState | null, FormData>(
    saveWhatsAppConfigAction,
    null,
  );

  return (
    <form action={formAction} className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="wa-access-token">{t("accessToken")}</Label>
        <Input
          id="wa-access-token"
          name="accessToken"
          type="password"
          autoComplete="off"
          placeholder={initial.hasAccessToken ? t("storedSecret") : ""}
        />
        <p className="text-xs text-muted-foreground">
          {initial.hasAccessToken ? t("storedSecretHint") : t("accessTokenHint")}
        </p>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="wa-phone-id">{t("phoneNumberId")}</Label>
          <Input
            id="wa-phone-id"
            name="phoneNumberId"
            defaultValue={initial.phoneNumberId}
            maxLength={80}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="wa-business-id">{t("businessAccountId")}</Label>
          <Input
            id="wa-business-id"
            name="businessAccountId"
            defaultValue={initial.businessAccountId}
            maxLength={80}
          />
        </div>
      </div>
      <label className="flex items-center gap-2 text-sm">
        <Checkbox name="isEnabled" defaultChecked={initial.isEnabled} />
        <span>{t("isEnabled")}</span>
      </label>
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
