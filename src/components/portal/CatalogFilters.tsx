"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useTransition, useMemo } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";

interface Item {
  id: string;
  name: string;
}

interface CategoryItem extends Item {
  businessLineId: string;
}

interface Props {
  businessLines: Item[];
  categories: CategoryItem[];
  companies: Array<{ value: string; label: string }>;
  initial: { bl?: string; cat?: string; company?: string; q?: string };
}

export function CatalogFilters({ businessLines, categories, companies, initial }: Props) {
  const router = useRouter();
  const params = useSearchParams();
  const [pending, startTransition] = useTransition();
  const t = useTranslations("catalog.filters");

  const visibleCategories = useMemo(
    () => (initial.bl ? categories.filter((c) => c.businessLineId === initial.bl) : categories),
    [categories, initial.bl],
  );

  function update(patch: Record<string, string | undefined>) {
    const next = new URLSearchParams(params.toString());
    for (const [k, v] of Object.entries(patch)) {
      if (v && v !== "") next.set(k, v);
      else next.delete(k);
    }
    // Reset category if business line changes
    if ("bl" in patch) next.delete("cat");
    startTransition(() => {
      router.push(`/catalog?${next.toString()}`);
    });
  }

  function clearAll() {
    startTransition(() => {
      router.push("/catalog");
    });
  }

  return (
    <div className="rounded-lg border bg-card p-4 shadow-soft">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <div className="space-y-1.5">
          <Label htmlFor="filter-q">{t("search")}</Label>
          <Input
            id="filter-q"
            type="search"
            defaultValue={initial.q ?? ""}
            onBlur={(e) => update({ q: e.target.value || undefined })}
            disabled={pending}
            placeholder={t("search")}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="filter-bl">{t("businessLine")}</Label>
          <Select
            id="filter-bl"
            value={initial.bl ?? ""}
            onChange={(e) => update({ bl: e.target.value || undefined })}
            disabled={pending}
          >
            <option value="">{t("any")}</option>
            {businessLines.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="filter-cat">{t("category")}</Label>
          <Select
            id="filter-cat"
            value={initial.cat ?? ""}
            onChange={(e) => update({ cat: e.target.value || undefined })}
            disabled={pending}
          >
            <option value="">{t("any")}</option>
            {visibleCategories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="filter-company">{t("company")}</Label>
          <Select
            id="filter-company"
            value={initial.company ?? ""}
            onChange={(e) => update({ company: e.target.value || undefined })}
            disabled={pending}
          >
            <option value="">{t("any")}</option>
            {companies.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </Select>
        </div>
        <div className="flex items-end">
          <Button variant="outline" onClick={clearAll} disabled={pending} className="w-full">
            {t("clear")}
          </Button>
        </div>
      </div>
    </div>
  );
}
