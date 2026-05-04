import { getTranslations } from "next-intl/server";
import { PhasePlaceholder } from "../_placeholder";

export default async function CatalogPage() {
  const t = await getTranslations("nav");
  return <PhasePlaceholder title={t("catalog")} phase={2} />;
}
