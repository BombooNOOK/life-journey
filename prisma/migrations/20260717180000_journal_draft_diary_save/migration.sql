-- 日記下書き + どんぐり台帳の relatedDiaryId

CREATE TABLE IF NOT EXISTS "JournalDraft" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "email" TEXT NOT NULL,
    "profileId" TEXT NOT NULL,
    "dateKey" TEXT NOT NULL,
    "content" TEXT NOT NULL DEFAULT '',
    "mood" TEXT NOT NULL DEFAULT 'calm',
    "activity" TEXT NOT NULL DEFAULT 'record_anyway',
    "companionType" TEXT NOT NULL DEFAULT 'owl',
    "designTheme" TEXT NOT NULL DEFAULT 'simple',
    "contentFontMode" TEXT NOT NULL DEFAULT 'standard',
    "photoBlobUrl" TEXT,
    "photoBlobPathname" TEXT,
    "photoMimeType" TEXT,
    "photoSizeBytes" INTEGER,
    "writingMode" TEXT NOT NULL DEFAULT 'alone',

    CONSTRAINT "JournalDraft_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "JournalDraft_email_profileId_dateKey_key"
  ON "JournalDraft"("email", "profileId", "dateKey");

CREATE INDEX IF NOT EXISTS "JournalDraft_email_profileId_idx"
  ON "JournalDraft"("email", "profileId");

ALTER TABLE "LogHouseDonguriLedgerEntry" ADD COLUMN IF NOT EXISTS "relatedDiaryId" TEXT;

CREATE INDEX IF NOT EXISTS "LogHouseDonguriLedgerEntry_relatedDiaryId_idx"
  ON "LogHouseDonguriLedgerEntry"("relatedDiaryId");
