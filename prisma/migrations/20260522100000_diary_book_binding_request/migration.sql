-- CreateTable
CREATE TABLE "DiaryBookBindingRequest" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "email" TEXT NOT NULL,
    "profileId" TEXT NOT NULL DEFAULT '',
    "year" INTEGER NOT NULL,
    "diaryBindingCode" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "pageCount" INTEGER NOT NULL,
    "planId" TEXT NOT NULL,
    "displayTitle" TEXT,
    "periodStartMonth" INTEGER NOT NULL,
    "periodEndMonth" INTEGER NOT NULL,
    "baseOrderNumber" TEXT,
    "baseBuyerName" TEXT,

    CONSTRAINT "DiaryBookBindingRequest_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "DiaryBookBindingRequest_diaryBindingCode_key" ON "DiaryBookBindingRequest"("diaryBindingCode");

-- CreateIndex
CREATE INDEX "DiaryBookBindingRequest_status_createdAt_idx" ON "DiaryBookBindingRequest"("status", "createdAt");

-- CreateIndex
CREATE INDEX "DiaryBookBindingRequest_email_profileId_year_idx" ON "DiaryBookBindingRequest"("email", "profileId", "year");

-- CreateIndex
CREATE INDEX "DiaryBookBindingRequest_diaryBindingCode_idx" ON "DiaryBookBindingRequest"("diaryBindingCode");
