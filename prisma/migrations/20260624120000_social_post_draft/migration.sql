-- CreateTable
CREATE TABLE "SocialPostDraft" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "authorEmail" TEXT NOT NULL,
    "theme" TEXT NOT NULL DEFAULT '',
    "companionType" TEXT NOT NULL DEFAULT 'owl',
    "platform" TEXT NOT NULL DEFAULT 'instagram',
    "scheduledDate" TEXT NOT NULL DEFAULT '',
    "todayNumber" INTEGER,
    "bodyText" TEXT NOT NULL DEFAULT '',
    "hashtags" TEXT NOT NULL DEFAULT '',
    "imageMemo" TEXT NOT NULL DEFAULT '',
    "linkUrl" TEXT NOT NULL DEFAULT '',
    "internalMemo" TEXT NOT NULL DEFAULT '',
    "status" TEXT NOT NULL DEFAULT 'draft',
    "templateId" TEXT,

    CONSTRAINT "SocialPostDraft_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "SocialPostDraft_status_scheduledDate_idx" ON "SocialPostDraft"("status", "scheduledDate");

-- CreateIndex
CREATE INDEX "SocialPostDraft_platform_scheduledDate_idx" ON "SocialPostDraft"("platform", "scheduledDate");

-- CreateIndex
CREATE INDEX "SocialPostDraft_updatedAt_idx" ON "SocialPostDraft"("updatedAt");
