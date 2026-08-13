-- Official additive migration: JournalSaveOperation (4B-4U).
-- Promoted from prisma/poc/4b4p_journal_save_operation.sql semantics.
-- No Journal body / photo / secrets.
-- No FK to JournalEntry: keep operation history if entry is deleted (e.g. insufficient-donguri rollback).
-- No DROP of existing product tables.

-- CreateTable
CREATE TABLE "JournalSaveOperation" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "actorKey" TEXT NOT NULL,
    "saveOperationId" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "checkpoint" TEXT NOT NULL,
    "journalEntryId" TEXT,
    "requestFingerprint" TEXT NOT NULL,
    "resultCode" TEXT,
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "JournalSaveOperation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "JournalSaveOperation_actorKey_saveOperationId_key" ON "JournalSaveOperation"("actorKey", "saveOperationId");

-- CreateIndex
CREATE INDEX "JournalSaveOperation_actorKey_createdAt_idx" ON "JournalSaveOperation"("actorKey", "createdAt");
