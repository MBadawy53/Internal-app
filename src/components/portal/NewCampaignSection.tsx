"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  QrCampaignForm,
  type CampaignInitial,
  type TemplateOption,
  type LeadFormTemplateOption,
} from "@/components/portal/QrCampaignForm";

interface Props {
  employees: { id: string; name: string; businessLineId?: string }[];
  products: { id: string; name: string; businessLineId: string }[];
  templates: TemplateOption[];
  leadFormTemplates?: LeadFormTemplateOption[];
  initial: CampaignInitial;
}

export function NewCampaignSection({
  employees,
  products,
  templates,
  leadFormTemplates = [],
  initial,
}: Props) {
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
        <QrCampaignForm
          employees={employees}
          products={products}
          templates={templates}
          leadFormTemplates={leadFormTemplates}
          initial={initial}
        />
      </CardContent>
    </Card>
  );
}
