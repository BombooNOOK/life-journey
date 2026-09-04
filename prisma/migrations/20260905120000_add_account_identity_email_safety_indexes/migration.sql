-- AI-X6.7C1.5A2-I1: AccountIdentityEmail safety indexes (additive only).
-- No data mutation. No status changes. No deletes.
--
-- A) At most one CURRENT primary owner per normalized email globally.
--    Retired rows may coexist with a different identity's primary (email reuse).
-- B) At most one row per (identityId, emailNormalized) for Model-1 reactivation.

-- CreateIndex
CREATE UNIQUE INDEX "AccountIdentityEmail_one_primary_per_email"
ON "AccountIdentityEmail" ("emailNormalized")
WHERE "status" = 'primary';

-- CreateIndex
CREATE UNIQUE INDEX "AccountIdentityEmail_identity_email_key"
ON "AccountIdentityEmail" ("identityId", "emailNormalized");
