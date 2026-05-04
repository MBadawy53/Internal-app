import { getTranslations } from "next-intl/server";
import { PhasePlaceholder } from "../_placeholder";

export default async function CalculatorPage() {
  const t = await getTranslations("nav");
  return <PhasePlaceholder title={t("calculator")} phase={2} />;
}
