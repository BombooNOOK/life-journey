-- 4B-4N PoC artifact ONLY.
-- DO NOT add to prisma/migrations (Vercel build:prisma migrate deploy would hit Neon).
-- DO NOT apply to production Neon.
-- Optional local disposable apply: DATABASE_URL=postgresql://...@127.0.0.1:5433/ljd_dev
--
-- Unique defence: (userId, saveOperationId)
-- No content / photo / secrets on this table.

CREATE TABLE IF NOT EXISTS "JournalSaveOperation" (
  "id" TEXT PRIMARY KEY,
  "userId" TEXT NOT NULL,
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

CREATE UNIQUE INDEX IF NOT EXISTS "JournalSaveOperation_userId_saveOperationId_key"
  ON "JournalSaveOperation" ("userId", "saveOperationId");

CREATE INDEX IF NOT EXISTS "JournalSaveOperation_userId_createdAt_idx"
  ON "JournalSaveOperation" ("userId", "createdAt");
