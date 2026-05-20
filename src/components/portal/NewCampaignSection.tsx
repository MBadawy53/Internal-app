"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  QrCampaignForm,
  type CampaignInitial,
  type TemplateOption,
} from "@/components/portal/QrCampaignForm";

interface Props {
  products: { id: string; name: string; businessLineId: string }[];
  templates: TemplateOption[];
  initial: CampaignInitial;
}

export function NewCampaignSection({ products, templates, initial }: Props) {
  const t = useTranslations("qr");
  const [open, setOpen] = useState(false);

  if (!open) {
    return (
      <div className="flex justify-end">
        <Button type="button" onClick={() => setOpen(true)}>
          + {t("newCampaign")}
        </Button>
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">{t("newCampaign")}</CardTitle>
          <Button type="button" variant="ghost" size="sm" onClick={() => setOpen(false)}>
            {t("close")}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <QrCampaignForm products={products} templates={templates} initial={initial} />
      </CardContent>
    </Card>
  );
}
