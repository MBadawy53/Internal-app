"use client";

import { useActionState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  acceptAmbassadorInviteAction,
  type AcceptInviteState,
} from "@/server/actions/ambassadorApplications";

export function AmbassadorAcceptInviteForm({ token }: { token: string }) {
  const t = useTranslations("public.ambassadorInvite");
  const [state, formAction, pending] = useActionState<AcceptInviteState | null, FormData>(
    acceptAmbassadorInviteAction,
    null,
  );

  const errs = state && state.ok === false ? (state.fieldErrors ?? {}) : {};

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="token" value={token} />
      <p className="rounded-md border bg-secondary/30 p-3 text-sm">{t("intro")}</p>

      <div className="space-y-1.5">
        <Label htmlFor="ai-phone">{t("phone")}</Label>
        <Input
          id="ai-phone"
          name="phone"
          type="tel"
          autoComplete="tel"
          required
          aria-invalid={Boolean(errs.phone)}
        />
        <p className="text-xs text-muted-foreground">{t("phoneHint")}</p>
        {errs.phone ? <p className="text-xs text-destructive">{errs.phone}</p> : null}
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="ai-password">{t("password")}</Label>
        <Input
          id="ai-password"
          name="password"
          type="password"
          autoComplete="new-password"
          minLength={8}
          required
          aria-invalid={Boolean(errs.password)}
        />
        {errs.password ? <p className="text-xs text-destructive">{errs.password}</p> : null}
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="ai-password-confirm">{t("passwordConfirm")}</Label>
        <Input
          id="ai-password-confirm"
          name="passwordConfirm"
          type="password"
          autoComplete="new-password"
          minLength={8}
          required
          aria-invalid={Boolean(errs.passwordConfirm)}
        />
        {errs.passwordConfirm ? (
          <p className="text-xs text-destructive">{errs.passwordConfirm}</p>
        ) : null}
      </div>

      <Button type="submit" disabled={pending} className="w-full">
        {pending ? t("submitting") : t("submit")}
      </Button>
      {state && state.ok === false && state.message ? (
        <p role="alert" className="text-sm text-destructive">
          {state.message}
        </p>
      ) : null}
    </form>
  );
}
