"use client";

import { useTransition } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { markAllNotificationsReadAction } from "@/server/actions/notifications";

export function MarkAllReadButton({ disabled }: { disabled?: boolean }) {
  const t = useTranslations("notifications");
  const [pending, startTransition] = useTransition();
  return (
    <Button
      variant="outline"
      size="sm"
      disabled={disabled || pending}
      onClick={() => startTransition(() => markAllNotificationsReadAction())}
    >
      {pending ? "…" : t("markAllRead")}
    </Button>
  );
}
