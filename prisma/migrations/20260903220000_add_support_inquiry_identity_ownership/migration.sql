-- AI-X6.7B7D: Additive SupportInquiry.identityId for identity-stable support access.
-- Historical contact email retained. Nullable during transition. FK RESTRICT.
-- Do NOT apply to Production in this phase.

ALTER TABLE "SupportInquiry" ADD COLUMN "identityId" TEXT;

CREATE INDEX "SupportInquiry_identityId_createdAt_idx" ON "SupportInquiry"("identityId", "createdAt");

ALTER TABLE "SupportInquiry" ADD CONSTRAINT "SupportInquiry_identityId_fkey" FOREIGN KEY ("identityId") REFERENCES "AccountIdentity"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
