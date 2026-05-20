"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";

/**
 * Mirror of the server's SmartDeleteResult so callers can't accidentally
 * read `message` on success or `mode` on failure.
 */
export type DeleteResult = { ok: true; mode: "hard" | "soft" } | { ok: false; message: string };

interface Props {
  /**
   * Server action that performs the smart delete. Should return:
   *   { ok: true, mode: "hard" | "soft" }   on success
   *   { ok: false, message: "..." }         on failure
   */
  action: () => Promise<DeleteResult>;
  /** Optional label for the trigger button. Defaults to a translated "Delete". */
  label?: string;
  /** If true, render only the trash icon (compact). */
  iconOnly?: boolean;
  /** "outline" matches list-card actions; "ghost" tucks into row controls. */
  variant?: "outline" | "ghost" | "destructive";
  size?: "sm" | "icon" | "default";
}

export function DeleteButton({
  action,
  label,
  iconOnly = false,
  variant = "outline",
  size = "sm",
}: Props) {
  const t = useTranslations("common.delete");
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<DeleteResult | null>(null);

  const triggerLabel = label ?? t("delete");

  if (done?.ok) {
    return (
      <span className="text-xs text-emerald-700">
        {done.mode === "soft" ? t("doneSoft") : t("doneHard")}
      </span>
    );
  }

  if (!open) {
    return (
      <Button
        type="button"
        size={size}
        variant={variant === "destructive" ? "destructive" : variant}
        onClick={() => {
          setError(null);
          setOpen(true);
        }}
        className={variant === "outline" ? "text-destructive" : undefined}
      >
        <Trash2 className={iconOnly ? "h-4 w-4" : "me-1 h-4 w-4"} aria-hidden />
        {iconOnly ? null : triggerLabel}
      </Button>
    );
  }

  return (
    <div className="inline-flex items-center gap-2 rounded-md border border-destructive/40 bg-destructive/10 px-2 py-1 text-xs">
      <span className="font-medium text-destructive">{t("confirm")}</span>
      <Button
        type="button"
        size="sm"
        variant="destructive"
        disabled={pending}
        onClick={() => {
          setError(null);
          startTransition(async () => {
            try {
              const result = await action();
              if (result.ok) {
                setDone(result);
                router.refresh();
              } else {
                setError(result.message ?? t("failed"));
                setOpen(false);
              }
            } catch (e) {
              setError((e as Error).message || t("failed"));
              setOpen(false);
            }
          });
        }}
      >
        {pending ? t("deleting") : t("yes")}
      </Button>
      <Button
        type="button"
        size="sm"
        variant="ghost"
        disabled={pending}
        onClick={() => {
          setOpen(false);
          setError(null);
        }}
      >
        {t("cancel")}
      </Button>
      {error ? (
        <span role="alert" className="text-destructive">
          {error}
        </span>
      ) : null}
    </div>
  );
}
