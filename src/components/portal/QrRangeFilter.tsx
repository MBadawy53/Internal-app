"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useTransition } from "react";
import { useTranslations } from "next-intl";

const PRESETS = ["7d", "30d", "90d", "all"] as const;
type Preset = (typeof PRESETS)[number];

function isPreset(v: string | null): v is Preset {
  return v !== null && (PRESETS as readonly string[]).includes(v);
}

export function QrRangeFilter() {
  const t = useTranslations("qr.range");
  const router = useRouter();
  const sp = useSearchParams();
  const [, start] = useTransition();

  const range = isPreset(sp.get("range")) ? (sp.get("range") as Preset) : "30d";
  const from = sp.get("from") ?? "";
  const to = sp.get("to") ?? "";
  const isCustom = range === ("custom" as Preset) || (from !== "" && to !== "");

  function update(next: Record<string, string | null>) {
    const params = new URLSearchParams(sp.toString());
    for (const [k, v] of Object.entries(next)) {
      if (v === null || v === "") params.delete(k);
      else params.set(k, v);
    }
    const qs = params.toString();
    start(() => router.replace(qs ? `?${qs}` : "?"));
  }

  function applyPreset(p: Preset) {
    update({ range: p, from: null, to: null });
  }

  return (
    <div className="flex flex-wrap items-center gap-3 rounded-md border bg-secondary/30 p-3 text-sm">
      <span className="font-medium">{t("label")}</span>
      <div className="inline-flex rounded-md border bg-background p-1">
        {PRESETS.map((p) => {
          const active = !isCustom && range === p;
          return (
            <button
              key={p}
              type="button"
              onClick={() => applyPreset(p)}
              className={
                "rounded px-3 py-1 text-xs " +
                (active ? "bg-brand-50 font-medium text-brand-700" : "text-muted-foreground")
              }
            >
              {t(p)}
            </button>
          );
        })}
      </div>
      <label className="flex items-center gap-1 text-xs">
        <span className="text-muted-foreground">{t("from")}</span>
        <input
          type="date"
          value={from}
          onChange={(e) => update({ from: e.target.value, range: null })}
          className="rounded-md border bg-background px-2 py-1"
        />
      </label>
      <label className="flex items-center gap-1 text-xs">
        <span className="text-muted-foreground">{t("to")}</span>
        <input
          type="date"
          value={to}
          onChange={(e) => update({ to: e.target.value, range: null })}
          className="rounded-md border bg-background px-2 py-1"
        />
      </label>
    </div>
  );
}
