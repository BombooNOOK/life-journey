-- 管理者一覧用の会員番号（登録順）

ALTER TABLE "AccountSettings" ADD COLUMN IF NOT EXISTS "memberNumber" INTEGER;

-- 既存行を createdAt 昇順で 1 から採番（まだ番号がない行のみ）
WITH ordered AS (
  SELECT "id", ROW_NUMBER() OVER (ORDER BY "createdAt" ASC, "id" ASC) AS rn
  FROM "AccountSettings"
  WHERE "memberNumber" IS NULL
)
UPDATE "AccountSettings" AS a
SET "memberNumber" = ordered.rn
FROM ordered
WHERE a."id" = ordered."id";

CREATE UNIQUE INDEX IF NOT EXISTS "AccountSettings_memberNumber_key"
  ON "AccountSettings"("memberNumber");
