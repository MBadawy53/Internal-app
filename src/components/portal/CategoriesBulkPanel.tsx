"use client";

import { useActionState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  bulkImportCategoriesAction,
  purgeInactiveCategoriesAction,
  type BulkImportState,
  type PurgeInactiveState,
} from "@/server/actions/categoriesBulk";

export function CategoriesBulkPanel() {
  const t = useTranslations("admin.categories.bulk");
  const tCommon = useTranslations("common");
  const [state, formAction, pending] = useActionState<BulkImportState | null, FormData>(
    bulkImportCategoriesAction,
    null,
  );
  const [purgeState, purgeAction, purging] = useActionState<PurgeInactiveState | null, FormData>(
    purgeInactiveCategoriesAction,
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
          href="/api/admin/categories/export"
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
        <form
          action={purgeAction}
          onSubmit={(e) => {
            if (!window.confirm(t("purgeConfirm"))) e.preventDefault();
          }}
        >
          <Button type="submit" size="sm" variant="destructive" disabled={purging}>
            {purging ? tCommon("saving") : t("purge")}
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

      {purgeState && purgeState.ok ? (
        <div className="space-y-2 rounded-md border bg-emerald-50 p-3 text-xs">
          <p className="font-medium text-emerald-700">
            {t("purgeSummary", { deleted: purgeState.deleted, skipped: purgeState.skipped.length })}
          </p>
          {purgeState.skipped.length > 0 ? (
            <details className="text-muted-foreground">
              <summary className="cursor-pointer">{t("purgeSkippedToggle")}</summary>
              <ul className="ms-4 mt-1 list-disc">
                {purgeState.skipped.map((s) => (
                  <li key={s.slug}>
                    {s.nameEn} ({s.slug}) — {t("purgeSkippedReason", { count: s.productCount })}
                  </li>
                ))}
              </ul>
            </details>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
