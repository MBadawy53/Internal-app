import { getTranslations } from "next-intl/server";
import { requireActor } from "@/lib/auth/session";
import { requireFeatureAccess } from "@/lib/auth/permissions";
import { PhasePlaceholder } from "../_placeholder";

export default async function ReportsPage() {
  const actor = await requireActor();
  requireFeatureAccess(actor, "reports");
  const t = await getTranslations("nav");
  return <PhasePlaceholder title={t("reports")} phase={6} />;
}
