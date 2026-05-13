"use client";

import { useActionState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { updateProfileInfoAction, type ProfileInfoState } from "@/server/actions/profile";

export interface ProfileInfoInitial {
  groupId: string;
  role: string;
  businessLine: string | null;
  referralCode: string | null;
  nameEn: string;
  nameAr: string;
  email: string;
  phone: string;
}

export function ProfileInfoForm({ initial }: { initial: ProfileInfoInitial }) {
  const t = useTranslations("profile.info");
  const tRoles = useTranslations("roles");
  const tCommon = useTranslations("common");
  const [state, formAction, pending] = useActionState<ProfileInfoState | null, FormData>(
    updateProfileInfoAction,
    null,
  );

  const errs = state && state.ok === false ? (state.fieldErrors ?? {}) : {};
  const roleLabel = (() => {
    try {
      return tRoles(initial.role);
    } catch {
      return initial.role;
    }
  })();

  return (
    <form action={formAction} className="max-w-xl space-y-6">
      <section className="grid gap-3 sm:grid-cols-2">
        <ReadOnlyField label={t("groupId")} value={initial.groupId} />
        <ReadOnlyField label={t("role")} value={roleLabel} />
        <ReadOnlyField label={t("businessLine")} value={initial.businessLine ?? "—"} />
        <ReadOnlyField label={t("referralCode")} value={initial.referralCode ?? "—"} />
      </section>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="pi-name-en">{t("nameEn")}</Label>
          <Input
            id="pi-name-en"
            name="nameEn"
            defaultValue={initial.nameEn}
            required
            minLength={2}
            maxLength={120}
            aria-invalid={Boolean(errs.nameEn)}
          />
          {errs.nameEn ? <p className="text-xs text-destructive">{errs.nameEn}</p> : null}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="pi-name-ar">{t("nameAr")}</Label>
          <Input
            id="pi-name-ar"
            name="nameAr"
            dir="rtl"
            defaultValue={initial.nameAr}
            required
            minLength={2}
            maxLength={120}
            aria-invalid={Boolean(errs.nameAr)}
          />
          {errs.nameAr ? <p className="text-xs text-destructive">{errs.nameAr}</p> : null}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="pi-email">{t("email")}</Label>
          <Input
            id="pi-email"
            name="email"
            type="email"
            autoComplete="email"
            defaultValue={initial.email}
            required
            aria-invalid={Boolean(errs.email)}
          />
          {errs.email ? <p className="text-xs text-destructive">{errs.email}</p> : null}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="pi-phone">{t("phone")}</Label>
          <Input
            id="pi-phone"
            name="phone"
            type="tel"
            autoComplete="tel"
            defaultValue={initial.phone}
            required
            aria-invalid={Boolean(errs.phone)}
          />
          {errs.phone ? <p className="text-xs text-destructive">{errs.phone}</p> : null}
        </div>
      </div>

      <div className="flex items-center gap-3">
        <Button type="submit" disabled={pending}>
          {pending ? tCommon("saving") : t("submit")}
        </Button>
        {state && state.ok === false && state.message ? (
          <p role="alert" className="text-sm text-destructive">
            {state.message}
          </p>
        ) : null}
        {state && state.ok ? <p className="text-sm text-emerald-600">{t("success")}</p> : null}
      </div>
    </form>
  );
}

function ReadOnlyField({ label, value }: { label: string; value: string }) {
  return (
    <div className="space-y-1">
      <p className="text-xs uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className="rounded-md border bg-muted/30 px-3 py-2 text-sm">{value}</p>
    </div>
  );
}
