-- AI-X6.7B7B P1A: Additive identity ownership for Order + LogHouseDonguriLedgerEntry.
-- Nullable during hybrid transition. Email columns retained (receipt/audit/contact).
-- KanteiBookBindingRequest inherits ownership via Order.identityId (orderId soft link).
-- FK ON DELETE RESTRICT: product rows must be purged/rebound before identity deletion.
-- No row rewrite in this migration. Backfill is a separate dry-run/apply phase.
-- Do NOT apply to Production in this phase.

-- AlterTable
ALTER TABLE "Order" ADD COLUMN "identityId" TEXT;

-- AlterTable
ALTER TABLE "LogHouseDonguriLedgerEntry" ADD COLUMN "identityId" TEXT;

-- CreateIndex
CREATE INDEX "Order_identityId_profileId_idx" ON "Order"("identityId", "profileId");

-- CreateIndex
CREATE INDEX "Order_identityId_createdAt_idx" ON "Order"("identityId", "createdAt");

-- CreateIndex
CREATE INDEX "LogHouseDonguriLedgerEntry_identityId_profileId_idx" ON "LogHouseDonguriLedgerEntry"("identityId", "profileId");

-- CreateIndex
CREATE INDEX "LogHouseDonguriLedgerEntry_identityId_createdAt_idx" ON "LogHouseDonguriLedgerEntry"("identityId", "createdAt");

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_identityId_fkey" FOREIGN KEY ("identityId") REFERENCES "AccountIdentity"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LogHouseDonguriLedgerEntry" ADD CONSTRAINT "LogHouseDonguriLedgerEntry_identityId_fkey" FOREIGN KEY ("identityId") REFERENCES "AccountIdentity"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
