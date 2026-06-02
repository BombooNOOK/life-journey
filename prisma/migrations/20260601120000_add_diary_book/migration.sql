-- CreateTable
CREATE TABLE "DiaryBook" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "email" TEXT NOT NULL,
    "profileId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "startDate" TEXT NOT NULL,
    "endDate" TEXT NOT NULL,
    "coverTheme" TEXT NOT NULL DEFAULT 'casual',

    CONSTRAINT "DiaryBook_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "DiaryBook_email_profileId_createdAt_idx" ON "DiaryBook"("email", "profileId", "createdAt");
