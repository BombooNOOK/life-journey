-- AlterTable
ALTER TABLE "GardenPlant" ADD COLUMN "afterBloomChoice" TEXT;

-- CreateTable
CREATE TABLE "GardenDisplayFlower" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "email" TEXT NOT NULL,
    "profileId" TEXT NOT NULL,
    "slotIndex" INTEGER NOT NULL,
    "seedType" TEXT NOT NULL DEFAULT 'default',
    "flowerColor" TEXT,
    "displayedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GardenDisplayFlower_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "GardenDisplayFlower_email_profileId_idx" ON "GardenDisplayFlower"("email", "profileId");

-- CreateIndex
CREATE UNIQUE INDEX "GardenDisplayFlower_email_profileId_slotIndex_key" ON "GardenDisplayFlower"("email", "profileId", "slotIndex");
