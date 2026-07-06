-- AlterTable
ALTER TABLE "AccountSettings" ADD COLUMN "forestResidentNumber" TEXT;
ALTER TABLE "AccountSettings" ADD COLUMN "forestResidentIssuedAt" TIMESTAMP(3);

-- CreateIndex
CREATE UNIQUE INDEX "AccountSettings_forestResidentNumber_key" ON "AccountSettings"("forestResidentNumber");
