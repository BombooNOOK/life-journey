-- CreateTable
CREATE TABLE "GardenPlant" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "email" TEXT NOT NULL,
    "profileId" TEXT NOT NULL,
    "seedType" TEXT NOT NULL DEFAULT 'default',
    "waterCount" INTEGER NOT NULL DEFAULT 0,
    "lastWateredOn" TEXT,
    "completedAt" TIMESTAMP(3),
    "flowerColor" TEXT,
    "potType" TEXT,
    "gardenSlot" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "GardenPlant_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "GardenPlant_email_profileId_idx" ON "GardenPlant"("email", "profileId");

-- CreateIndex
CREATE UNIQUE INDEX "GardenPlant_email_profileId_seedType_gardenSlot_key" ON "GardenPlant"("email", "profileId", "seedType", "gardenSlot");
