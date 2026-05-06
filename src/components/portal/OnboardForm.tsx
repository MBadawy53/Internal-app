"use client";

import { useActionState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  onboardAction,
  startOnboardAction,
  type OnboardActionState,
} from "@/server/actions/onboard";

export function OnboardLookup() {
  const t = useTranslations("auth.onboard");
  return (
    <form action={startOnboardAction} className="space-y-5">
      <div className="space-y-2">
        <Label htmlFor="groupId">{t("groupId")}</Label>
        <Input
          id="groupId"
          name="groupId"
          required
          autoCapitalize="characters"
          spellCheck={false}
          placeholder={t("groupIdPlaceholder")}
          pattern="C[0-9]{4}C"
        />
      </div>
      <Button type="submit" className="w-full">
        {t("lookupSubmit")}
      </Button>
    </form>
  );
}

export function OnboardForm({ groupId }: { groupId: string }) {
  const t = useTranslations("auth.onboard");
  const [state, formAction, pending] = useActionState<OnboardActionState | null, FormData>(
    onboardAction,
    null,
  );

  const errs = state && !state.ok ? (state.fieldErrors ?? {}) : {};
  const message = state && !state.ok ? state.message : null;

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="groupId" value={groupId} />

      <div className="rounded-md border bg-secondary/50 px-3 py-2 text-xs">
        <span className="text-muted-foreground">{t("groupId")}:</span>{" "}
        <code className="font-mono font-semibold">{groupId}</code>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="nameEn">{t("nameEn")}</Label>
          <Input id="nameEn" name="nameEn" required minLength={2} />
          {errs.nameEn ? (
            <p className="text-xs text-destructive">{errs.nameEn.join(", ")}</p>
          ) : null}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="nameAr">{t("nameAr")}</Label>
          <Input id="nameAr" name="nameAr" required minLength={2} dir="rtl" />
          {errs.nameAr ? (
            <p className="text-xs text-destructive">{errs.nameAr.join(", ")}</p>
          ) : null}
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="email">{t("emailLabel")}</Label>
        <Input id="email" name="email" type="email" autoComplete="email" required />
        {errs.email ? <p className="text-xs text-destructive">{errs.email.join(", ")}</p> : null}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="phone">{t("phone")}</Label>
        <Input
          id="phone"
          name="phone"
          type="tel"
          autoComplete="tel"
          required
          placeholder={t("phonePlaceholder")}
        />
        {errs.phone ? <p className="text-xs text-destructive">{errs.phone.join(", ")}</p> : null}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="password">{t("password")}</Label>
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="new-password"
          minLength={8}
          required
        />
        <p className="text-xs text-muted-foreground">{t("passwordHint")}</p>
        {errs.password ? (
          <p className="text-xs text-destructive">{errs.password.join(", ")}</p>
        ) : null}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="passwordConfirm">{t("passwordConfirm")}</Label>
        <Input
          id="passwordConfirm"
          name="passwordConfirm"
          type="password"
          autoComplete="new-password"
          required
        />
        {errs.passwordConfirm ? (
          <p className="text-xs text-destructive">{errs.passwordConfirm.join(", ")}</p>
        ) : null}
      </div>

      {message ? (
        <p
          role="alert"
          className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive"
        >
          {message}
        </p>
      ) : null}

      <Button type="submit" className="w-full" disabled={pending}>
        {pending ? t("submitting") : t("submit")}
      </Button>
    </form>
  );
}
