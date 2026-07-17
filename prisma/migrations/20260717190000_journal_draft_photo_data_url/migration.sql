-- 下書き写真の data URL フォールバック（Blob 未設定環境用）
ALTER TABLE "JournalDraft" ADD COLUMN IF NOT EXISTS "photoDataUrl" TEXT;
