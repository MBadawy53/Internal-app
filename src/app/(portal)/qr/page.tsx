import { getTranslations } from "next-intl/server";
import { PhasePlaceholder } from "../_placeholder";

export default async function QrPage() {
  const t = await getTranslations("nav");
  return <PhasePlaceholder title={t("qr")} phase={4} />;
}
