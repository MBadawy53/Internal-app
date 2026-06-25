"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useActionState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { loginAction, type LoginActionState } from "@/server/actions/auth";

type Persona = "employee" | "ambassador";

export function LoginForm({ from }: { from?: string }) {
  const t = useTranslations("auth.login");
  const router = useRouter();
  const [persona, setPersona] = useState<Persona>("employee");
  const [state, formAction, pending] = useActionState<LoginActionState | null, FormData>(
    loginAction,
    null,
  );

  // If the action signals "must onboard", route to the onboarding flow.
  useEffect(() => {
    if (state && !state.ok && state.error === "mustOnboard" && state.groupId) {
      router.push(`/onboard?groupId=${encodeURIComponent(state.groupId)}`);
    }
  }, [state, router]);

  const errorMessage =
    state && !state.ok && state.error !== "mustOnboard" ? t(`errors.${state.error}`) : null;

  const placeholder =
    persona === "ambassador" ? t("identifierPlaceholderAmbassador") : t("identifierPlaceholder");
  const hint = persona === "ambassador" ? t("identifierHintAmbassador") : t("identifierHint");

  return (
    <form action={formAction} className="space-y-5">
      {from ? <input type="hidden" name="from" value={from} /> : null}

      <div role="tablist" className="inline-flex rounded-md border bg-secondary/40 p-1 text-sm">
        <button
          type="button"
          role="tab"
          aria-selected={persona === "employee"}
          onClick={() => setPersona("employee")}
          className={
            "rounded px-3 py-1.5 text-xs " +
            (persona === "employee"
              ? "bg-background font-medium shadow-sm"
              : "text-muted-foreground")
          }
        >
          {t("personaEmployee")}
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={persona === "ambassador"}
          onClick={() => setPersona("ambassador")}
          className={
            "rounded px-3 py-1.5 text-xs " +
            (persona === "ambassador"
              ? "bg-background font-medium shadow-sm"
              : "text-muted-foreground")
          }
        >
          {t("personaAmbassador")}
        </button>
      </div>

      <div className="space-y-2">
        <Label htmlFor="identifier">{t("identifier")}</Label>
        <Input
          id="identifier"
          name="identifier"
          type="text"
          autoComplete="username"
          placeholder={placeholder}
          required
          autoCapitalize="characters"
          spellCheck={false}
        />
        <p className="text-xs text-muted-foreground">{hint}</p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="password">{t("password")}</Label>
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          placeholder={t("passwordPlaceholder")}
          required
        />
      </div>

      {errorMessage ? (
        <p
          role="alert"
          className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive"
        >
          {errorMessage}
        </p>
      ) : null}

      <Button type="submit" className="w-full" disabled={pending}>
        {pending ? t("submitting") : t("submit")}
      </Button>

      <div className="space-y-1 text-center text-xs text-muted-foreground">
        <p>
          <Link href="/forgot" className="font-medium text-primary hover:underline">
            {t("forgotPassword")}
          </Link>
        </p>
        <p>
          {t("firstTime")}{" "}
          <Link href="/onboard" className="font-medium text-primary hover:underline">
            {t("activateAccount")}
          </Link>
        </p>
      </div>
    </form>
  );
}
