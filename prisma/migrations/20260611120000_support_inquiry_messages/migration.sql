-- CreateTable
CREATE TABLE "SupportInquiryMessage" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "inquiryId" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "authorEmail" TEXT,

    CONSTRAINT "SupportInquiryMessage_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "SupportInquiryMessage_inquiryId_createdAt_idx" ON "SupportInquiryMessage"("inquiryId", "createdAt");

-- AddForeignKey
ALTER TABLE "SupportInquiryMessage" ADD CONSTRAINT "SupportInquiryMessage_inquiryId_fkey" FOREIGN KEY ("inquiryId") REFERENCES "SupportInquiry"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Backfill initial user messages from existing inquiries
INSERT INTO "SupportInquiryMessage" ("id", "createdAt", "inquiryId", "role", "body")
SELECT
    'mig_' || "id",
    "createdAt",
    "id",
    'user',
    "message"
FROM "SupportInquiry";
