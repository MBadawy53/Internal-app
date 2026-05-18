"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  approveAmbassadorApplicationAction,
  rejectAmbassadorApplicationAction,
} from "@/server/actions/ambassadorApplications";

interface Props {
  id: string;
  name: string;
  phone: string;
  nationalIdImageUrl: string | null;
  createdAt: Date;
}

export function PendingApplicationCard({ id, name, phone, nationalIdImageUrl, createdAt }: Props) {
  const t = useTranslations("ambassadors.applications");
  const [pending, start] = useTransition();
  const [inviteUrl, setInviteUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [showRejectForm, setShowRejectForm] = useState(false);
  const [reason, setReason] = useState("");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [done, setDone] = useState<"approved" | "rejected" | null>(null);

  function approve() {
    setErrorMsg(null);
    start(async () => {
      const fd = new FormData();
      fd.set("id", id);
      const res = await approveAmbassadorApplicationAction(null, fd);
      if (res.ok) {
        setInviteUrl(res.inviteUrl ?? null);
        setDone("approved");
      } else {
        setErrorMsg(res.message);
      }
    });
  }

  function reject() {
    setErrorMsg(null);
    start(async () => {
      const fd = new FormData();
      fd.set("id", id);
      fd.set("reason", reason);
      const res = await rejectAmbassadorApplicationAction(null, fd);
      if (res.ok) {
        setDone("rejected");
      } else {
        setErrorMsg(res.message);
      }
    });
  }

  async function copyInviteUrl() {
    if (!inviteUrl) return;
    try {
      await navigator.clipboard.writeText(inviteUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // ignore
    }
  }

  const whatsappHref = inviteUrl
    ? `https://wa.me/${phone.replace(/[^0-9]/g, "")}?text=${encodeURIComponent(
        `${t("whatsappMessage")} ${inviteUrl}`,
      )}`
    : null;

  return (
    <Card>
      <CardContent className="space-y-3 py-4">
        <div className="flex items-start gap-4">
          {nationalIdImageUrl ? (
            <a href={nationalIdImageUrl} target="_blank" rel="noopener noreferrer">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={nationalIdImageUrl}
                alt=""
                className="h-16 w-24 shrink-0 rounded-md border bg-white object-cover"
              />
            </a>
          ) : null}
          <div className="flex-1 space-y-1 text-sm">
            <Link
              href={`/ambassadors/applications/${id}`}
              className="font-medium text-brand-700 hover:underline"
            >
              {name}
            </Link>
            <p className="text-xs text-muted-foreground">{phone}</p>
            <p className="text-xs text-muted-foreground">{new Date(createdAt).toLocaleString()}</p>
          </div>
        </div>

        {done === "approved" && inviteUrl ? (
          <div className="space-y-2 rounded-md border bg-emerald-50 p-3 text-xs">
            <p className="font-medium text-emerald-700">{t("approved")}</p>
            <p className="break-all">{inviteUrl}</p>
            <div className="flex flex-wrap gap-2">
              <Button type="button" size="sm" variant="outline" onClick={copyInviteUrl}>
                {copied ? t("copied") : t("copy")}
              </Button>
              {whatsappHref ? (
                <a
                  href={whatsappHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center rounded-md border bg-background px-3 py-1.5 text-xs hover:bg-secondary"
                >
                  {t("whatsapp")}
                </a>
              ) : null}
            </div>
            <p className="text-muted-foreground">{t("expiresHint")}</p>
          </div>
        ) : done === "rejected" ? (
          <p className="rounded-md border bg-secondary/30 p-3 text-xs text-muted-foreground">
            {t("rejectedConfirmation")}
          </p>
        ) : showRejectForm ? (
          <div className="space-y-2">
            <Label htmlFor={`reason-${id}`}>{t("reasonLabel")}</Label>
            <Input
              id={`reason-${id}`}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              maxLength={500}
              placeholder={t("reasonPlaceholder")}
            />
            <div className="flex gap-2">
              <Button type="button" size="sm" disabled={pending} onClick={reject}>
                {pending ? t("submitting") : t("confirmReject")}
              </Button>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={() => setShowRejectForm(false)}
              >
                {t("cancel")}
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex gap-2">
            <Button type="button" size="sm" disabled={pending} onClick={approve}>
              {pending ? t("submitting") : t("approve")}
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => setShowRejectForm(true)}
            >
              {t("reject")}
            </Button>
          </div>
        )}

        {errorMsg ? (
          <p role="alert" className="text-xs text-destructive">
            {errorMsg}
          </p>
        ) : null}
      </CardContent>
    </Card>
  );
}
