-- AlterTable
ALTER TABLE "AccountSettings" ADD COLUMN "freeTrialStartedAt" TIMESTAMP(3);

-- B区分: 日記あり一般ユーザー → 公式リリース日（アプリ定数と同期）
UPDATE "AccountSettings" AS a
SET "freeTrialStartedAt" = TIMESTAMP '2026-06-10 00:00:00'
WHERE a."isAdmin" = false
  AND a."isMonitor" = false
  AND NOT (
    a."subscriptionStatus" IN ('active', 'trialing')
    AND a."subscriptionPlan" IS NOT NULL
  )
  AND EXISTS (
    SELECT 1
    FROM "JournalEntry" AS j
    WHERE j."email" = a."email"
  );
