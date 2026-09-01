-- AI-X6.5A: Additive AccountSettings.identityId anchor (local foundation only).
-- Nullable during transition. Email unique retained. No row rewrite.
-- UNIQUE(identityId): one AccountIdentity → at most one AccountSettings
--   (PostgreSQL UNIQUE allows multiple NULLs for legacy unbound rows).
-- FK ON DELETE RESTRICT: identity cannot be removed while settings still
--   reference it. Product/account purge must precede identity deletion.

-- AlterTable
ALTER TABLE "AccountSettings" ADD COLUMN "identityId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "AccountSettings_identityId_key" ON "AccountSettings"("identityId");

-- AddForeignKey
ALTER TABLE "AccountSettings" ADD CONSTRAINT "AccountSettings_identityId_fkey" FOREIGN KEY ("identityId") REFERENCES "AccountIdentity"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
