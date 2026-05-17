"use client";

import { useActionState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { submitPublicLeadAction, type PublicLeadState } from "@/server/actions/qr";

interface Props {
  code: string;
}

export function PublicLeadForm({ code }: Props) {
  const t = useTranslations("public.leadCapture");
  const tForm = useTranslations("leads.form");
  const [state, formAction, pending] = useActionState<PublicLeadState | null, FormData>(
    submitPublicLeadAction,
    null,
  );

  if (state && state.ok) {
    return (
      <p className="rounded-md border border-emerald-500/30 bg-emerald-500/10 p-4 text-center text-sm text-emerald-700">
        {t("thanks")}
      </p>
    );
  }

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="code" value={code} />
      {/* Honeypot — real users won't see / fill this. Bots usually do. */}
      <label aria-hidden className="absolute -left-[9999px] top-auto h-0 w-0 overflow-hidden">
        <span>Leave this field empty.</span>
        <input type="text" name="company" tabIndex={-1} autoComplete="off" defaultValue="" />
      </label>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="pl-name">{tForm("customerName")}</Label>
          <Input id="pl-name" name="customerName" required maxLength={160} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="pl-phone">{tForm("customerPhone")}</Label>
          <Input id="pl-phone" name="customerPhone" required type="tel" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="pl-email">{tForm("customerEmail")}</Label>
          <Input id="pl-email" name="customerEmail" type="email" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="pl-time">{tForm("preferredContactTime")}</Label>
          <Select id="pl-time" name="preferredContactTime" defaultValue="">
            <option value="">{tForm("preferredContactTimeAny")}</option>
            <option value="10:00–14:00">{tForm("preferredContactTimeSlots.morning")}</option>
            <option value="14:00–18:00">{tForm("preferredContactTimeSlots.afternoon")}</option>
            <option value="18:00–22:00">{tForm("preferredContactTimeSlots.evening")}</option>
          </Select>
        </div>
        <div className="space-y-1.5 sm:col-span-2">
          <Label htmlFor="pl-note">{tForm("customerNote")}</Label>
          <Textarea id="pl-note" name="customerNote" rows={3} maxLength={1000} />
        </div>
      </div>

      <label className="flex items-start gap-2 rounded-md border bg-secondary/30 p-3 text-sm">
        <Checkbox name="consentGiven" required />
        <span>{tForm("consent")}</span>
      </label>

      <Button type="submit" disabled={pending} className="w-full">
        {pending ? t("submitting") : t("submit")}
      </Button>

      {state && state.ok === false ? (
        <p role="alert" className="text-sm text-destructive">
          {state.message}
        </p>
      ) : null}
    </form>
  );
}
