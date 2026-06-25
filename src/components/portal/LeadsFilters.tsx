"use client";

import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useState, useTransition } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";

interface Option {
  value: string;
  label: string;
}

interface Props {
  initial: { status: string; source: string; q: string; from: string; to: string };
  statuses: Option[];
  sources: Option[];
}

export function LeadsFilters({ initial, statuses, sources }: Props) {
  const router = useRouter();
  const t = useTranslations("leads.filters");
  const tCommon = useTranslations("common");
  const [pending, startTransition] = useTransition();

  const [status, setStatus] = useState(initial.status);
  const [source, setSource] = useState(initial.source);
  const [q, setQ] = useState(initial.q);
  const [from, setFrom] = useState(initial.from);
  const [to, setTo] = useState(initial.to);

  function apply() {
    const sp = new URLSearchParams();
    if (status) sp.set("status", status);
    if (source) sp.set("source", source);
    if (q) sp.set("q", q);
    if (from) sp.set("from", from);
    if (to) sp.set("to", to);
    const qs = sp.toString();
    startTransition(() => router.push(`/leads${qs ? `?${qs}` : ""}`));
  }

  function clear() {
    setStatus("");
    setSource("");
    setQ("");
    setFrom("");
    setTo("");
    startTransition(() => router.push("/leads"));
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        apply();
      }}
      className="grid gap-3 rounded-md border bg-secondary/30 p-3 md:grid-cols-6"
    >
      <div className="space-y-1.5 md:col-span-2">
        <Label htmlFor="lf-q">{t("search")}</Label>
        <Input id="lf-q" value={q} onChange={(e) => setQ(e.target.value)} placeholder="…" />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="lf-status">{t("status")}</Label>
        <Select id="lf-status" value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="">{tCommon("all")}</option>
          {statuses.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </Select>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="lf-source">{t("source")}</Label>
        <Select id="lf-source" value={source} onChange={(e) => setSource(e.target.value)}>
          <option value="">{tCommon("all")}</option>
          {sources.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </Select>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="lf-from">{t("from")}</Label>
        <Input id="lf-from" type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="lf-to">{t("to")}</Label>
        <Input id="lf-to" type="date" value={to} onChange={(e) => setTo(e.target.value)} />
      </div>
      <div className="flex items-end gap-2 md:col-span-6">
        <Button type="submit" disabled={pending}>
          {t("apply")}
        </Button>
        <Button type="button" variant="outline" onClick={clear} disabled={pending}>
          {t("clear")}
        </Button>
      </div>
    </form>
  );
}
