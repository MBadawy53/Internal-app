import { getTranslations } from "next-intl/server";
import { PhasePlaceholder } from "../_placeholder";

export default async function LeadsPage() {
  const t = await getTranslations("nav");
  return <PhasePlaceholder title={t("leads")} phase={3} />;
}
