-- CreateTable
CREATE TABLE "SupportInquiry" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "email" TEXT NOT NULL,
    "activeProfileId" TEXT,
    "activeProfileName" TEXT,
    "category" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',

    CONSTRAINT "SupportInquiry_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "SupportInquiry_status_createdAt_idx" ON "SupportInquiry"("status", "createdAt");

-- CreateIndex
CREATE INDEX "SupportInquiry_email_createdAt_idx" ON "SupportInquiry"("email", "createdAt");

-- CreateIndex
CREATE INDEX "SupportInquiry_category_createdAt_idx" ON "SupportInquiry"("category", "createdAt");
