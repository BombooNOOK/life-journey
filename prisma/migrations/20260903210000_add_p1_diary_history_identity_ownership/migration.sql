-- AI-X6.7B7A: Additive identity ownership for diary-history surfaces.
-- JournalDraft, DiaryBook, DiaryBookshelfBook, DiaryBookBindingRequest.
-- Nullable during hybrid transition. Email/profile/date/year columns retained.
-- FK ON DELETE RESTRICT. No row rewrite in this migration.
-- Do NOT apply to Production in this phase.

ALTER TABLE "JournalDraft" ADD COLUMN "identityId" TEXT;
ALTER TABLE "DiaryBook" ADD COLUMN "identityId" TEXT;
ALTER TABLE "DiaryBookshelfBook" ADD COLUMN "identityId" TEXT;
ALTER TABLE "DiaryBookBindingRequest" ADD COLUMN "identityId" TEXT;

CREATE INDEX "JournalDraft_identityId_profileId_dateKey_idx" ON "JournalDraft"("identityId", "profileId", "dateKey");
CREATE INDEX "JournalDraft_identityId_profileId_idx" ON "JournalDraft"("identityId", "profileId");

CREATE INDEX "DiaryBook_identityId_profileId_createdAt_idx" ON "DiaryBook"("identityId", "profileId", "createdAt");
CREATE INDEX "DiaryBook_identityId_idx" ON "DiaryBook"("identityId");

CREATE INDEX "DiaryBookshelfBook_identityId_profileId_year_idx" ON "DiaryBookshelfBook"("identityId", "profileId", "year");
CREATE INDEX "DiaryBookshelfBook_identityId_profileId_idx" ON "DiaryBookshelfBook"("identityId", "profileId");

CREATE INDEX "DiaryBookBindingRequest_identityId_profileId_idx" ON "DiaryBookBindingRequest"("identityId", "profileId");
CREATE INDEX "DiaryBookBindingRequest_identityId_diaryBookId_idx" ON "DiaryBookBindingRequest"("identityId", "diaryBookId");

ALTER TABLE "JournalDraft" ADD CONSTRAINT "JournalDraft_identityId_fkey" FOREIGN KEY ("identityId") REFERENCES "AccountIdentity"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "DiaryBook" ADD CONSTRAINT "DiaryBook_identityId_fkey" FOREIGN KEY ("identityId") REFERENCES "AccountIdentity"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "DiaryBookshelfBook" ADD CONSTRAINT "DiaryBookshelfBook_identityId_fkey" FOREIGN KEY ("identityId") REFERENCES "AccountIdentity"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "DiaryBookBindingRequest" ADD CONSTRAINT "DiaryBookBindingRequest_identityId_fkey" FOREIGN KEY ("identityId") REFERENCES "AccountIdentity"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
