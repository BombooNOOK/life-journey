-- AI-X6.7B2 P0: Additive identity ownership for Profile + JournalEntry (local foundation).
-- Nullable during hybrid transition. Email columns retained for compatibility.
-- Profile.identityId is NOT unique (one identity → many profiles; profileLimit ≥ 1).
-- JournalEntry.identityId is direct FK to AccountIdentity (not Profile-only inheritance):
--   JournalEntry.profileId is a soft string (no Prisma FK); profiles may be archived/deleted.
-- FK ON DELETE RESTRICT: product rows must be purged/rebound before identity deletion
--   (matches AccountSettings.identityId semantics from AI-X6.5A).
-- No row rewrite in this migration. Backfill is a separate dry-run/apply phase.
-- Do NOT apply to Production in this phase.

-- AlterTable
ALTER TABLE "Profile" ADD COLUMN "identityId" TEXT;

-- AlterTable
ALTER TABLE "JournalEntry" ADD COLUMN "identityId" TEXT;

-- CreateIndex
CREATE INDEX "Profile_identityId_isArchived_idx" ON "Profile"("identityId", "isArchived");

-- CreateIndex
CREATE INDEX "JournalEntry_identityId_profileId_idx" ON "JournalEntry"("identityId", "profileId");

-- CreateIndex
CREATE INDEX "JournalEntry_identityId_updatedAt_idx" ON "JournalEntry"("identityId", "updatedAt");

-- AddForeignKey
ALTER TABLE "Profile" ADD CONSTRAINT "Profile_identityId_fkey" FOREIGN KEY ("identityId") REFERENCES "AccountIdentity"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JournalEntry" ADD CONSTRAINT "JournalEntry_identityId_fkey" FOREIGN KEY ("identityId") REFERENCES "AccountIdentity"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
