-- Introduce the AMBASSADOR_MANAGER role: dedicated owner for any lead that came
-- in through an ambassador's QR / referral link. Existing ambassador-referred
-- leads are test data per product team and are deleted here so the new routing
-- model starts from a clean state. LeadActivity, LeadStatusHistory and the
-- LeadIdUploadToken table cascade on lead delete; Quote does not, so those
-- rows are removed explicitly first.

ALTER TYPE "Role" ADD VALUE IF NOT EXISTS 'AMBASSADOR_MANAGER';

DELETE FROM "quotes"
 WHERE "leadId" IN (
   SELECT l.id FROM "leads" l
   JOIN "users" u ON u.id = l."referredByEmployeeId"
   WHERE u.role = 'AMBASSADOR'
 );

DELETE FROM "leads"
 WHERE "referredByEmployeeId" IN (
   SELECT id FROM "users" WHERE role = 'AMBASSADOR'
 );
