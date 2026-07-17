-- 森からのお知らせ（共通本文）とユーザー別既読

CREATE TABLE IF NOT EXISTS "SystemNotice" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "publishedAt" TIMESTAMP(3),
    "unpublishedAt" TIMESTAMP(3),
    "actionLabel" TEXT,
    "actionRoute" TEXT,
    "authorEmail" TEXT,

    CONSTRAINT "SystemNotice_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "SystemNotice_status_publishedAt_idx"
  ON "SystemNotice"("status", "publishedAt");

CREATE INDEX IF NOT EXISTS "SystemNotice_createdAt_idx"
  ON "SystemNotice"("createdAt");

CREATE TABLE IF NOT EXISTS "SystemNoticeReadState" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "noticeId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "profileId" TEXT NOT NULL,
    "readAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SystemNoticeReadState_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "SystemNoticeReadState_noticeId_email_profileId_key"
  ON "SystemNoticeReadState"("noticeId", "email", "profileId");

CREATE INDEX IF NOT EXISTS "SystemNoticeReadState_email_profileId_idx"
  ON "SystemNoticeReadState"("email", "profileId");

CREATE INDEX IF NOT EXISTS "SystemNoticeReadState_noticeId_idx"
  ON "SystemNoticeReadState"("noticeId");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'SystemNoticeReadState_noticeId_fkey'
  ) THEN
    ALTER TABLE "SystemNoticeReadState"
      ADD CONSTRAINT "SystemNoticeReadState_noticeId_fkey"
      FOREIGN KEY ("noticeId") REFERENCES "SystemNotice"("id")
      ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;
