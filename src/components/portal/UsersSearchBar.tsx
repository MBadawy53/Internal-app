"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export function UsersSearchBar({ initial }: { initial: string }) {
  const router = useRouter();
  const t = useTranslations("admin.users.search");
  const [q, setQ] = useState(initial);
  const [pending, startTransition] = useTransition();

  function submit(e?: React.FormEvent) {
    e?.preventDefault();
    const sp = new URLSearchParams();
    if (q.trim()) sp.set("q", q.trim());
    const qs = sp.toString();
    startTransition(() => router.push(`/admin/users${qs ? `?${qs}` : ""}`));
  }

  function clear() {
    setQ("");
    startTransition(() => router.push("/admin/users"));
  }

  return (
    <form onSubmit={submit} className="flex items-center gap-2">
      <div className="relative flex-1">
        <Search
          aria-hidden
          className="pointer-events-none absolute start-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
        />
        <Input
          type="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder={t("placeholder")}
          className="ps-8"
        />
      </div>
      <Button type="submit" size="sm" disabled={pending}>
        {t("search")}
      </Button>
      {initial ? (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={clear}
          disabled={pending}
          aria-label={t("clear")}
        >
          <X className="h-4 w-4" />
        </Button>
      ) : null}
    </form>
  );
}
