"use client";

import Link from "next/link";
import { useActionState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { resetPasswordAction, type ResetPasswordState } from "@/server/actions/passwordReset";

export function ResetPasswordForm({ token }: { token: string }) {
  const t = useTranslations("public.passwordReset");
  const [state, formAction, pending] = useActionState<ResetPasswordState, FormData>(
    resetPasswordAction,
    null,
  );

  const errs = state && state.ok === false ? (state.fieldErrors ?? {}) : {};

  if (state?.ok) {
    return (
      <div className="space-y-4">
        <div
          role="status"
          className="rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800"
        >
          <p className="font-medium">{t("doneTitle")}</p>
          <p className="mt-1 text-emerald-700">{t("doneBody")}</p>
        </div>
        <Button asChild className="w-full">
          <Link href="/login">{t("toLogin")}</Link>
        </Button>
      </div>
    );
  }

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="token" value={token} />

      <div className="space-y-1.5">
        <Label htmlFor="pr-password">{t("password")}</Label>
        <Input
          id="pr-password"
          name="password"
          type="password"
          autoComplete="new-password"
          minLength={8}
          required
          aria-invalid={Boolean(errs.password)}
        />
        <p className="text-xs text-muted-foreground">{t("passwordHint")}</p>
        {errs.password ? <p className="text-xs text-destructive">{errs.password}</p> : null}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="pr-password-confirm">{t("passwordConfirm")}</Label>
        <Input
          id="pr-password-confirm"
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
