-- AlterTable
ALTER TABLE "Order" ADD COLUMN "profileId" TEXT NOT NULL DEFAULT '';

-- AlterTable
ALTER TABLE "JournalEntry" ADD COLUMN "profileId" TEXT NOT NULL DEFAULT '';

-- AlterTable
ALTER TABLE "DiaryBookshelfBook" ADD COLUMN "profileId" TEXT NOT NULL DEFAULT '';

-- Replace unique key for diary bookshelf settings
DROP INDEX IF EXISTS "DiaryBookshelfBook_email_year_key";
CREATE UNIQUE INDEX "DiaryBookshelfBook_email_profileId_year_key"
ON "DiaryBookshelfBook"("email", "profileId", "year");

-- Create indexes
CREATE INDEX "Order_email_profileId_idx" ON "Order"("email", "profileId");
CREATE INDEX "JournalEntry_email_profileId_idx" ON "JournalEntry"("email", "profileId");
CREATE INDEX "DiaryBookshelfBook_email_profileId_idx" ON "DiaryBookshelfBook"("email", "profileId");

-- CreateTable
CREATE TABLE "Profile" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "email" TEXT NOT NULL,
    "nickname" TEXT NOT NULL,
    "isArchived" BOOLEAN NOT NULL DEFAULT false,
    CONSTRAINT "Profile_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Profile_email_isArchived_idx" ON "Profile"("email", "isArchived");

-- Seed a default profile per existing account and backfill profileId
INSERT INTO "Profile" ("id", "createdAt", "updatedAt", "email", "nickname", "isArchived")
SELECT
  'legacy:' || md5(u.email) AS id,
  NOW(),
  NOW(),
  u.email,
  'メイン',
  false
FROM (
  SELECT DISTINCT "email" AS email FROM "Order"
  UNION
  SELECT DISTINCT "email" AS email FROM "JournalEntry"
  UNION
  SELECT DISTINCT "email" AS email FROM "DiaryBookshelfBook"
) AS u
WHERE u.email IS NOT NULL AND u.email <> '';

UPDATE "Order"
SET "profileId" = 'legacy:' || md5("email")
WHERE "profileId" = '';

UPDATE "JournalEntry"
SET "profileId" = 'legacy:' || md5("email")
WHERE "profileId" = '';

UPDATE "DiaryBookshelfBook"
SET "profileId" = 'legacy:' || md5("email")
WHERE "profileId" = '';
