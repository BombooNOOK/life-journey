-- Idempotent repair: migration history に載っていても実DBに列が無い場合に備える
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "kanteiCode" TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS "Order_kanteiCode_key" ON "Order"("kanteiCode");
