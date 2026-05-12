"use client";

import { useActionState, useRef } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { changePasswordAction, type ChangePasswordState } from "@/server/actions/profile";

export function ChangePasswordForm() {
  const t = useTranslations("profile.password");
  const tCommon = useTranslations("common");
  const formRef = useRef<HTMLFormElement>(null);
  const [state, formAction, pending] = useActionState<ChangePasswordState | null, FormData>(
    async (prev, fd) => {
      const res = await changePasswordAction(prev, fd);
      if (res.ok) formRef.current?.reset();
      return res;
    },
    null,
  );

  return (
    <form ref={formRef} action={formAction} className="max-w-md space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="cp-current">{t("currentPassword")}</Label>
        <Input
          id="cp-current"
          name="currentPassword"
          type="password"
          autoComplete="current-password"
          required
          aria-invalid={state?.ok === false && state.field === "currentPassword"}
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="cp-new">{t("newPassword")}</Label>
        <Input
          id="cp-new"
          name="newPassword"
          type="password"
          autoComplete="new-password"
          minLength={8}
          required
          aria-invalid={state?.ok === false && state.field === "newPassword"}
        />
        <p className="text-xs text-muted-foreground">{t("hint")}</p>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="cp-confirm">{t("confirmPassword")}</Label>
        <Input
          id="cp-confirm"
          name="confirmPassword"
          type="password"
          autoComplete="new-password"
          minLength={8}
          required
          aria-invalid={state?.ok === false && state.field === "confirmPassword"}
        />
      </div>

      <div className="flex items-center gap-3">
        <Button type="submit" disabled={pending}>
          {pending ? tCommon("saving") : t("submit")}
        </Button>
        {state && state.ok === false ? (
          <p role="alert" className="text-sm text-destructive">
            {state.message}
          </p>
        ) : null}
        {state && state.ok ? <p className="text-sm text-emerald-600">{t("success")}</p> : null}
      </div>
    </form>
  );
}
