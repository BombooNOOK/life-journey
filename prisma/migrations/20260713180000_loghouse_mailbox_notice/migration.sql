-- CreateTable
CREATE TABLE "LogHouseMailboxNotice" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "email" TEXT NOT NULL,
    "profileId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "actionLabel" TEXT,
    "actionRoute" TEXT,
    "relatedOrderId" TEXT,
    "readAt" TIMESTAMP(3),

    CONSTRAINT "LogHouseMailboxNotice_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "LogHouseMailboxNotice_email_profileId_createdAt_idx" ON "LogHouseMailboxNotice"("email", "profileId", "createdAt");

-- CreateIndex
CREATE INDEX "LogHouseMailboxNotice_email_profileId_readAt_idx" ON "LogHouseMailboxNotice"("email", "profileId", "readAt");
