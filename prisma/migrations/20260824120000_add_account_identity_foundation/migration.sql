-- AI-8.2: Additive AccountIdentity foundation (schema only; not applied in this phase).
-- Firebase UID is stable identity. Auth email is mutable/reusable and does NOT
-- authorize historical email-keyed actor rows. LegacyActorClaim row existence =
-- authorization. No login bootstrap. Gate X6 / email-change remains OPEN.
-- Derived stable actor key firebase:<UID> is NOT stored (buildFirebaseActorKey).

-- CreateTable
CREATE TABLE "AccountIdentity" (
    "id" TEXT NOT NULL,
    "firebaseUid" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AccountIdentity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AccountIdentityEmail" (
    "id" TEXT NOT NULL,
    "identityId" TEXT NOT NULL,
    "emailNormalized" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "boundAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "retiredAt" TIMESTAMP(3),

    CONSTRAINT "AccountIdentityEmail_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AccountIdentityLegacyActorClaim" (
    "id" TEXT NOT NULL,
    "identityId" TEXT NOT NULL,
    "actorKey" TEXT NOT NULL,
    "claimedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AccountIdentityLegacyActorClaim_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "AccountIdentity_firebaseUid_key" ON "AccountIdentity"("firebaseUid");

-- CreateIndex
CREATE INDEX "AccountIdentityEmail_identityId_status_idx" ON "AccountIdentityEmail"("identityId", "status");

-- At most one primary email per identity (multiple retired rows allowed).
-- Future email-change TX must retire old primary then insert new primary atomically.
CREATE UNIQUE INDEX "AccountIdentityEmail_one_primary_per_identity"
ON "AccountIdentityEmail" ("identityId")
WHERE "status" = 'primary';

-- CreateIndex
CREATE UNIQUE INDEX "AccountIdentityLegacyActorClaim_actorKey_key" ON "AccountIdentityLegacyActorClaim"("actorKey");

-- CreateIndex
CREATE INDEX "AccountIdentityLegacyActorClaim_identityId_idx" ON "AccountIdentityLegacyActorClaim"("identityId");

-- AddForeignKey
ALTER TABLE "AccountIdentityEmail" ADD CONSTRAINT "AccountIdentityEmail_identityId_fkey" FOREIGN KEY ("identityId") REFERENCES "AccountIdentity"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AccountIdentityLegacyActorClaim" ADD CONSTRAINT "AccountIdentityLegacyActorClaim_identityId_fkey" FOREIGN KEY ("identityId") REFERENCES "AccountIdentity"("id") ON DELETE CASCADE ON UPDATE CASCADE;
