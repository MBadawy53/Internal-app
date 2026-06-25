import { Company } from "@prisma/client";

export const COMPANY_LABELS_EN: Record<Company, string> = {
  CONTACT_CREDIT: "Contact Credit",
  GLOBAL_AUTO: "Global Auto",
  SMG: "SMG",
  ABO_GHALY_FINANCE: "Abo Ghaly Finance",
  EZZ_EL_ARAB_FINANCIAL: "Ezz El-Arab Financial",
  SARWA_LIFE: "Sarwa Life",
  SARWA_INSURANCE: "Sarwa Insurance",
  CONTACT_INSURANCE_BROKERAGE: "Contact Insurance Brokerage",
  CONTACT_MORTGAGE: "Contact Mortgage",
  CONTACT_FACTORING: "Contact Factoring",
  CONTACT_LEASING: "Contact Leasing",
  CONTACT_CREDITECH: "Contact Creditech",
};

export const COMPANY_LABELS_AR: Record<Company, string> = {
  CONTACT_CREDIT: "كونتكت كريديت",
  GLOBAL_AUTO: "جلوبال أوتو",
  SMG: "SMG",
  ABO_GHALY_FINANCE: "أبو غالي للتمويل",
  EZZ_EL_ARAB_FINANCIAL: "عز العرب للتمويل",
  SARWA_LIFE: "ثروة لايف",
  SARWA_INSURANCE: "ثروة للتأمين",
  CONTACT_INSURANCE_BROKERAGE: "كونتكت لوساطة التأمين",
  CONTACT_MORTGAGE: "كونتكت للرهن العقاري",
  CONTACT_FACTORING: "كونتكت للتخصيم",
  CONTACT_LEASING: "كونتكت للتأجير التمويلي",
  CONTACT_CREDITECH: "كونتكت كريديتك",
};

/**
 * Resolve a free-text company name from a CSV cell into the enum value.
 * Accepts the enum identifier itself (CONTACT_CREDIT), the English label
 * ("Contact Credit"), or the Arabic label. Whitespace and case are ignored
 * on the English side so admins can paste loosely.
 */
export function companyFromName(input: string): Company | null {
  const norm = input.trim();
  if (!norm) return null;
  const upper = norm.toUpperCase().replace(/[\s-]+/g, "_");
  if ((Object.values(Company) as string[]).includes(upper)) return upper as Company;
  for (const [key, label] of Object.entries(COMPANY_LABELS_EN)) {
    if (label.toLowerCase() === norm.toLowerCase()) return key as Company;
  }
  for (const [key, label] of Object.entries(COMPANY_LABELS_AR)) {
    if (label === norm) return key as Company;
  }
  return null;
}
