"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import {
  generateLeadIdUploadLinkAction,
  type GenerateLinkState,
} from "@/server/actions/leadIdUpload";

interface Props {
  leadId: string;
  /** Customer phone — used to pre-fill the WhatsApp share link. */
  customerPhone: string;
}

export function LeadIdLinkPanel({ leadId, customerPhone }: Props) {
  const t = useTranslations("leads.idUpload");
  const [pending, startTransition] = useTransition();
  const [result, setResult] = useState<GenerateLinkState>(null);
  const [copied, setCopied] = useState(false);

  const generate = () => {
    setResult(null);
    setCopied(false);
    startTransition(async () => {
      const r = await generateLeadIdUploadLinkAction(leadId);
      setResult(r);
    });
  };

  const copy = async () => {
    if (!result?.ok) return;
    try {
      await navigator.clipboard.writeText(result.url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // best-effort
    }
  };

  const phoneDigits = customerPhone.replace(/[^0-9]/g, "");
  const waHref =
    result?.ok && phoneDigits
      ? `https://wa.me/${phoneDigits}?text=${encodeURIComponent(
          `${t("whatsappMessage")} ${result.url}`,
        )}`
      : null;

  return (
    <section className="space-y-3 rounded-md border bg-secondary/30 p-4">
      <div>
        <p className="text-sm font-medium">{t("title")}</p>
        <p className="text-xs text-muted-foreground">{t("subtitle")}</p>
      </div>

      {result?.ok ? (
        <div className="space-y-2 rounded-md border border-emerald-200 bg-emerald-50 p-3 text-xs">
          <p className="font-medium text-emerald-700">{t("issuedTitle")}</p>
          <p className="text-emerald-700">
            {t("issuedBody", {
              expires: new Date(result.expiresAt).toLocaleString(),
            })}
          </p>
          <div className="flex items-center gap-2">
            <input
              readOnly
              value={result.url}
              onFocus={(e) => e.currentTarget.select()}
              className="flex-1 rounded border bg-background px-2 py-1 font-mono text-[11px]"
            />
            <Button type="button" size="sm" variant="outline" onClick={copy}>
              {copied ? t("copied") : t("copy")}
            </Button>
            {waHref ? (
              <Button asChild size="sm" variant="outline">
                <a href={waHref} target="_blank" rel="noopener noreferrer">
                  {t("whatsapp")}
                </a>
              </Button>
            ) : null}
          </div>
        </div>
      ) : null}

      {result && !result.ok ? (
        <p role="alert" className="text-xs text-destructive">
          {result.message}
        </p>
      ) : null}

      <Button type="button" size="sm" variant="outline" onClick={generate} disabled={pending}>
        {pending ? t("generating") : result?.ok ? t("regenerate") : t("generate")}
      </Button>
    </section>
  );
}
