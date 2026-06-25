"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { applyCampaignTemplateAction } from "@/server/actions/qr";

export function UseTemplateButton({ templateId }: { templateId: string }) {
  const t = useTranslations("qr");
  const tCommon = useTranslations("common");
  const router = useRouter();
  const [pending, start] = useTransition();

  return (
    <Button
      type="button"
      disabled={pending}
      onClick={() =>
        start(async () => {
          const fd = new FormData();
          fd.set("templateId", templateId);
          const res = await applyCampaignTemplateAction(fd);
          if (res.ok) {
            router.push("/qr");
            router.refresh();
          } else {
            alert(res.message);
          }
        })
      }
    >
      {pending ? tCommon("saving") : t("useTemplate")}
    </Button>
  );
}
