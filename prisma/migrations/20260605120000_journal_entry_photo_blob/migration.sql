-- JournalEntry: Vercel Blob 用メタ（photoDataUrl は互換のため残す）
ALTER TABLE "JournalEntry" ADD COLUMN IF NOT EXISTS "photoBlobUrl" TEXT;
ALTER TABLE "JournalEntry" ADD COLUMN IF NOT EXISTS "photoBlobPathname" TEXT;
ALTER TABLE "JournalEntry" ADD COLUMN IF NOT EXISTS "photoMimeType" TEXT;
ALTER TABLE "JournalEntry" ADD COLUMN IF NOT EXISTS "photoSizeBytes" INTEGER;
ALTER TABLE "JournalEntry" ADD COLUMN IF NOT EXISTS "photoStorageProvider" TEXT;
