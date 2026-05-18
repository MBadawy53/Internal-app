"use client";

import { useActionState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { saveEmailConfigAction, type SaveConfigState } from "@/server/actions/integrationConfig";

interface Props {
  initial: {
    isEnabled: boolean;
    smtpHost: string;
    smtpPort: number;
    smtpUser: string;
    smtpSecure: boolean;
    hasPassword: boolean;
    fromAddress: string;
    fromName: string;
  };
}

export function EmailConfigForm({ initial }: Props) {
  const t = useTranslations("configuration.email");
  const tCommon = useTranslations("common");
  const [state, formAction, pending] = useActionState<SaveConfigState | null, FormData>(
    saveEmailConfigAction,
    null,
  );

  return (
    <form action={formAction} className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="em-host">{t("smtpHost")}</Label>
          <Input id="em-host" name="smtpHost" defaultValue={initial.smtpHost} maxLength={200} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="em-port">{t("smtpPort")}</Label>
          <Input
            id="em-port"
            name="smtpPort"
            type="number"
            min={1}
            max={65535}
            defaultValue={initial.smtpPort || 587}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="em-user">{t("smtpUser")}</Label>
          <Input id="em-user" name="smtpUser" defaultValue={initial.smtpUser} maxLength={200} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="em-pass">{t("smtpPass")}</Label>
          <Input
            id="em-pass"
            name="smtpPass"
            type="password"
            autoComplete="off"
            placeholder={initial.hasPassword ? t("storedSecret") : ""}
          />
          <p className="text-xs text-muted-foreground">
            {initial.hasPassword ? t("storedSecretHint") : t("smtpPassHint")}
          </p>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="em-from-address">{t("fromAddress")}</Label>
          <Input
            id="em-from-address"
            name="fromAddress"
            type="email"
            defaultValue={initial.fromAddress}
            maxLength={200}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="em-from-name">{t("fromName")}</Label>
          <Input
            id="em-from-name"
            name="fromName"
            defaultValue={initial.fromName}
            maxLength={120}
          />
        </div>
      </div>
      <div className="flex flex-wrap gap-4">
        <label className="flex items-center gap-2 text-sm">
          <Checkbox name="smtpSecure" defaultChecked={initial.smtpSecure} />
          <span>{t("smtpSecure")}</span>
        </label>
        <label className="flex items-center gap-2 text-sm">
          <Checkbox name="isEnabled" defaultChecked={initial.isEnabled} />
          <span>{t("isEnabled")}</span>
        </label>
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
