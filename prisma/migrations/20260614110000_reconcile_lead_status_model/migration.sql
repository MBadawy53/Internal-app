-- Reconcile the Lead status model with prisma/schema.prisma.
--
-- The application schema replaced the single `LeadStatus` with separate
-- application / product status tracks (plus an optional fast/normal track) and
-- added national-ID image URLs and the final loan amount. Those schema changes
-- were applied to running databases via `prisma db push` but were never turned
-- into a migration, so `prisma migrate deploy` (used in CI) produced a database
-- out of sync with the generated Prisma client and broke `db:seed`.
-- This migration brings a migrate-deploy database in line with the schema.

-- CreateEnum
CREATE TYPE "LeadAppStatus" AS ENUM ('CREDIT_RISK', 'INCOMPLETE', 'INVESTIGATION', 'SALES', 'APPROVAL', 'APPROVED_CLIENT', 'DENIED', 'HOLD');

-- CreateEnum
CREATE TYPE "LeadProductStatus" AS ENUM ('P_INITIATE', 'PRE_EXECUTION', 'EXECUTION', 'P_REGISTER', 'CONTRACT', 'HOLD', 'SALES');

-- CreateEnum
CREATE TYPE "LeadTrack" AS ENUM ('FAST_TRACK', 'NORMAL_TRACK');

-- DropIndex
DROP INDEX "leads_currentStatus_idx";

-- AlterTable
ALTER TABLE "leads"
    ADD COLUMN "nationalIdFrontUrl" TEXT,
    ADD COLUMN "nationalIdBackUrl" TEXT,
    ADD COLUMN "appStatus" "LeadAppStatus" NOT NULL DEFAULT 'INCOMPLETE',
    ADD COLUMN "productStatus" "LeadProductStatus" NOT NULL DEFAULT 'P_INITIATE',
    ADD COLUMN "track" "LeadTrack",
    ADD COLUMN "finalLoanAmountPiastres" BIGINT,
    DROP COLUMN "currentStatus",
    DROP COLUMN "currentStatusReason";

-- AlterTable
ALTER TABLE "lead_status_history"
    ADD COLUMN "fromAppStatus" "LeadAppStatus",
    ADD COLUMN "toAppStatus" "LeadAppStatus",
    ADD COLUMN "fromProductStatus" "LeadProductStatus",
    ADD COLUMN "toProductStatus" "LeadProductStatus",
    ADD COLUMN "fromTrack" "LeadTrack",
    ADD COLUMN "toTrack" "LeadTrack",
    DROP COLUMN "fromStatus",
    DROP COLUMN "toStatus";

-- CreateIndex
CREATE INDEX "leads_appStatus_idx" ON "leads"("appStatus");

-- CreateIndex
CREATE INDEX "leads_productStatus_idx" ON "leads"("productStatus");

-- DropEnum
DROP TYPE "LeadStatus";
