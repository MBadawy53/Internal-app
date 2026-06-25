"use client";

import { useActionState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { bulkImportProductsAction, type BulkImportState } from "@/server/actions/productsBulk";

export function ProductsBulkPanel() {
  const t = useTranslations("admin.products.bulk");
  const tCommon = useTranslations("common");
  const [state, formAction, pending] = useActionState<BulkImportState | null, FormData>(
    bulkImportProductsAction,
    null,
  );

  return (
    <div className="space-y-3 rounded-md border bg-secondary/30 p-4">
      <div>
        <p className="text-sm font-medium">{t("title")}</p>
        <p className="text-xs text-muted-foreground">{t("subtitle")}</p>
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <a
          href="/api/admin/products/export"
          className="inline-flex items-center rounded-md border bg-background px-3 py-1.5 text-sm hover:bg-muted"
        >
          {t("download")}
        </a>
        <form
          action={formAction}
          className="flex flex-wrap items-center gap-2"
          encType="multipart/form-data"
        >
          <Input type="file" name="file" accept=".csv,text/csv" required className="max-w-sm" />
          <Button type="submit" size="sm" disabled={pending}>
            {pending ? tCommon("saving") : t("upload")}
          </Button>
        </form>
      </div>

      {state ? (
        state.ok ? (
          <div className="space-y-2 rounded-md border bg-emerald-50 p-3 text-xs">
            <p className="font-medium text-emerald-700">
              {t("summary", { created: state.created, updated: state.updated })}
            </p>
            {state.results.some((r) => !r.ok) ? (
              <details className="text-muted-foreground">
                <summary className="cursor-pointer">{t("errorsToggle")}</summary>
                <ul className="ms-4 mt-1 list-disc">
                  {state.results
                    .filter((r) => !r.ok)
                    .map((r, i) => (
                      <li key={i}>
                        {t("rowPrefix", { row: r.row })}: {(r as { error: string }).error}
                      </li>
                    ))}
                </ul>
              </details>
            ) : null}
          </div>
        ) : (
          <p role="alert" className="text-xs text-destructive">
            {state.message}
          </p>
        )
      ) : null}
    </div>
  );
}
