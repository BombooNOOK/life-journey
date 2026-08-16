-- Additive, empty-by-default rollout cohort for the Journal idempotency protocol.
-- No existing user is eligible until a separate controlled operator phase creates
-- an enabled row. No data migration, deletion, or unrelated table change.
CREATE TABLE "JournalSaveIdempotencyRollout" (
    "id" TEXT NOT NULL,
    "actorKey" TEXT NOT NULL,
    "protocolVersion" INTEGER NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "JournalSaveIdempotencyRollout_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "JournalSaveIdempotencyRollout_actorKey_key"
ON "JournalSaveIdempotencyRollout"("actorKey");
