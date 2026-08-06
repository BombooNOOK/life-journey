-- 端末動画森ログムービー確定の二重消費防止用 idempotencyKey

ALTER TABLE "LogHouseDonguriLedgerEntry" ADD COLUMN IF NOT EXISTS "idempotencyKey" TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS "LogHouseDonguriLedgerEntry_idempotencyKey_key"
  ON "LogHouseDonguriLedgerEntry"("idempotencyKey");
