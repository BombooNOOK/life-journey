-- AlterTable
ALTER TABLE "Order"
ALTER COLUMN "pdfDownloadLimit" SET DEFAULT 2;

-- Backfill existing rows to the new free-tier cap
UPDATE "Order"
SET "pdfDownloadLimit" = 2
WHERE "pdfDownloadLimit" = 3;
