-- Lead form gains two mandatory fields: employment type (enum) and Contact
-- branch (FK). The columns are nullable for historical leads created before
-- this change; new leads enforce mandatory at the application layer.

CREATE TYPE "EmploymentType" AS ENUM ('EMPLOYEE', 'SELF_EMPLOYED', 'BUSINESS_OWNER');

CREATE TABLE "branches" (
  "id"          TEXT NOT NULL,
  "slug"        TEXT NOT NULL,
  "nameEn"      TEXT NOT NULL,
  "nameAr"      TEXT NOT NULL,
  "city"        TEXT,
  "governorate" TEXT,
  "address"     TEXT,
  "phone"       TEXT,
  "isActive"    BOOLEAN NOT NULL DEFAULT true,
  "sortOrder"   INTEGER NOT NULL DEFAULT 0,
  "createdAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"   TIMESTAMP(3) NOT NULL,
  CONSTRAINT "branches_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "branches_slug_key" ON "branches"("slug");
CREATE INDEX "branches_isActive_sortOrder_idx" ON "branches"("isActive", "sortOrder");

ALTER TABLE "leads"
  ADD COLUMN "branchId"       TEXT,
  ADD COLUMN "employmentType" "EmploymentType";

ALTER TABLE "leads"
  ADD CONSTRAINT "leads_branchId_fkey"
  FOREIGN KEY ("branchId") REFERENCES "branches"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

CREATE INDEX "leads_branchId_idx" ON "leads"("branchId");
