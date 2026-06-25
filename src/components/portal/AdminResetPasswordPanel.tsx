"use client";

import { useActionState, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import {
  adminIssuePasswordResetAction,
  type AdminIssueResetState,
} from "@/server/actions/passwordReset";

export function AdminResetPasswordPanel({ userId }: { userId: string }) {
  const t = useTranslations("admin.users.resetPassword");
  const [state, formAction, pending] = useActionState<AdminIssueResetState, FormData>(
    adminIssuePasswordResetAction,
    null,
  );
  const [copied, setCopied] = useState(false);
  const linkRef = useRef<HTMLInputElement>(null);

  const handleCopy = async () => {
    if (state?.ok) {
      try {
        await navigator.clipboard.writeText(state.resetUrl);
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
      } catch {
        linkRef.current?.select();
        document.execCommand("copy");
      }
    }
  };

  return (
    <section className="space-y-3 rounded-md border bg-secondary/30 p-4">
      <div>
        <p className="text-sm font-medium">{t("title")}</p>
        <p className="text-xs text-muted-foreground">{t("subtitle")}</p>
      </div>

      {state?.ok ? (
        <div className="space-y-2 rounded-md border border-emerald-200 bg-emerald-50 p-3 text-xs">
          <p className="font-medium text-emerald-700">{t("issuedTitle")}</p>
          <p className="text-emerald-700">{t("issuedBody")}</p>
          <div className="flex items-center gap-2">
            <input
              ref={linkRef}
              readOnly
              value={state.resetUrl}
              className="flex-1 rounded border bg-background px-2 py-1 font-mono text-[11px]"
              onFocus={(e) => e.currentTarget.select()}
            />
            <Button type="button" size="sm" variant="outline" onClick={handleCopy}>
              {copied ? t("copied") : t("copy")}
            </Button>
          </div>
        </div>
      ) : null}

      {state && !state.ok ? (
        <p role="alert" className="text-xs text-destructive">
          {state.message}
        </p>
      ) : null}

      <form action={formAction}>
        <input type="hidden" name="userId" value={userId} />
        <Button type="submit" size="sm" variant="outline" disabled={pending}>
          {pending ? t("issuing") : state?.ok ? t("reissue") : t("issue")}
        </Button>
      </form>
    </section>
  );
}
