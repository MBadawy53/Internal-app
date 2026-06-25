-- Replace the ProductType enum with a new Company enum, wipe existing
-- values, and make the column nullable. Per product team request the field
-- now identifies the partner company instead of a product taxonomy; the old
-- 12 enum values do not map to the new 12, so we drop the data and let
-- admins re-tag each product (or use the bulk uploader).

DROP INDEX IF EXISTS "products_type_idx";

ALTER TABLE "products" DROP COLUMN "type";

DROP TYPE "ProductType";

CREATE TYPE "Company" AS ENUM (
  'CONTACT_CREDIT',
  'GLOBAL_AUTO',
  'SMG',
  'ABO_GHALY_FINANCE',
  'EZZ_EL_ARAB_FINANCIAL',
  'SARWA_LIFE',
  'SARWA_INSURANCE',
  'CONTACT_INSURANCE_BROKERAGE',
  'CONTACT_MORTGAGE',
  'CONTACT_FACTORING',
  'CONTACT_LEASING',
  'CONTACT_CREDITECH'
);

ALTER TABLE "products" ADD COLUMN "company" "Company";

CREATE INDEX "products_company_idx" ON "products"("company");
