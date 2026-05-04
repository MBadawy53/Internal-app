import { getTranslations } from "next-intl/server";
import { PhasePlaceholder } from "../_placeholder";

export default async function NotificationsPage() {
  const t = await getTranslations("nav");
  return <PhasePlaceholder title={t("notifications")} phase={5} />;
}
