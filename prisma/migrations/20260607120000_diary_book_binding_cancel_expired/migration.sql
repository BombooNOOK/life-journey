-- AlterTable
ALTER TABLE "DiaryBookBindingRequest" ADD COLUMN "cancelledAt" TIMESTAMP(3),
ADD COLUMN "cancelledBy" TEXT,
ADD COLUMN "cancelReason" TEXT,
ADD COLUMN "expiredAt" TIMESTAMP(3);
