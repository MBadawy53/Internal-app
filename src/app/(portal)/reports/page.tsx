import { getTranslations } from "next-intl/server";
import { PhasePlaceholder } from "../_placeholder";

export default async function ReportsPage() {
  const t = await getTranslations("nav");
  return <PhasePlaceholder title={t("reports")} phase={6} />;
}
