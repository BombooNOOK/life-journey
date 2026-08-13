-- 4B-4P non-production candidate ONLY.
-- DO NOT add to prisma/migrations/ until Vercel Preview DB isolation is proven.
-- DO NOT apply to production Neon.
-- Apply only to disposable local: 127.0.0.1:5433/ljd_dev (ljd-postgres-dev).
--
-- Column actorKey (not "email"): holds normalized viewer-email identity today
-- for Journal ownership compatibility; name allows future non-email identity migration.
-- Unique defence: (actorKey, saveOperationId)
-- No content / photo / secrets.

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'JournalSaveOperation'
  ) AND EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'JournalSaveOperation'
      AND column_name = 'userId'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'JournalSaveOperation'
      AND column_name = 'actorKey'
  ) THEN
    ALTER TABLE "JournalSaveOperation" RENAME COLUMN "userId" TO "actorKey";
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS "JournalSaveOperation" (
  "id" TEXT PRIMARY KEY,
  "actorKey" TEXT NOT NULL,
  "saveOperationId" TEXT NOT NULL,
  "status" TEXT NOT NULL,
  "checkpoint" TEXT NOT NULL,
  "journalEntryId" TEXT,
  "requestFingerprint" TEXT NOT NULL,
  "resultCode" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "completedAt" TIMESTAMP(3)
);

DROP INDEX IF EXISTS "JournalSaveOperation_userId_saveOperationId_key";
DROP INDEX IF EXISTS "JournalSaveOperation_userId_createdAt_idx";

CREATE UNIQUE INDEX IF NOT EXISTS "JournalSaveOperation_actorKey_saveOperationId_key"
  ON "JournalSaveOperation" ("actorKey", "saveOperationId");

CREATE INDEX IF NOT EXISTS "JournalSaveOperation_actorKey_createdAt_idx"
  ON "JournalSaveOperation" ("actorKey", "createdAt");
