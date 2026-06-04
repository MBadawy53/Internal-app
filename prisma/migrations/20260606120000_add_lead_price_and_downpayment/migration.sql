-- Capture the asset price and customer's planned down payment on every lead.
-- Both columns are nullable for historical rows; required by the application
-- layer for new submissions. Stored as piastres (BigInt) — same convention
-- as the rest of the money fields in the system.

ALTER TABLE "leads"
  ADD COLUMN "productPricePiastres" BIGINT,
  ADD COLUMN "downpaymentPiastres"  BIGINT;
