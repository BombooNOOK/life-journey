-- DiaryBook 単位の製本申込（既存の年単位レコードは維持）

ALTER TABLE "DiaryBookBindingRequest" ADD COLUMN "diaryBookId" TEXT;
ALTER TABLE "DiaryBookBindingRequest" ADD COLUMN "startDate" TEXT;
ALTER TABLE "DiaryBookBindingRequest" ADD COLUMN "endDate" TEXT;
ALTER TABLE "DiaryBookBindingRequest" ADD COLUMN "baseShopUrl" TEXT;

ALTER TABLE "DiaryBookBindingRequest" ALTER COLUMN "year" DROP NOT NULL;
ALTER TABLE "DiaryBookBindingRequest" ALTER COLUMN "periodStartMonth" DROP NOT NULL;
ALTER TABLE "DiaryBookBindingRequest" ALTER COLUMN "periodEndMonth" DROP NOT NULL;

CREATE INDEX "DiaryBookBindingRequest_diaryBookId_idx" ON "DiaryBookBindingRequest"("diaryBookId");
CREATE INDEX "DiaryBookBindingRequest_email_profileId_diaryBookId_idx" ON "DiaryBookBindingRequest"("email", "profileId", "diaryBookId");
