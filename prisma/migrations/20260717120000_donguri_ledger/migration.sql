-- どんぐり台帳 + ポストへの台帳参照

ALTER TABLE "LogHouseMailboxNotice" ADD COLUMN IF NOT EXISTS "relatedLedgerId" TEXT;

CREATE TABLE IF NOT EXISTS "LogHouseDonguriLedgerEntry" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "email" TEXT NOT NULL,
    "profileId" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "reason" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "dateKey" TEXT,
    "relatedNoticeId" TEXT,
    "createdBy" TEXT NOT NULL DEFAULT 'system',

    CONSTRAINT "LogHouseDonguriLedgerEntry_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "LogHouseDonguriLedgerEntry_email_profileId_reason_dateKey_key"
  ON "LogHouseDonguriLedgerEntry"("email", "profileId", "reason", "dateKey");

CREATE INDEX IF NOT EXISTS "LogHouseDonguriLedgerEntry_email_profileId_createdAt_idx"
  ON "LogHouseDonguriLedgerEntry"("email", "profileId", "createdAt");

CREATE INDEX IF NOT EXISTS "LogHouseDonguriLedgerEntry_email_createdAt_idx"
  ON "LogHouseDonguriLedgerEntry"("email", "createdAt");
