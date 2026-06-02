-- AlterTable
ALTER TABLE "AccountSettings" ADD COLUMN "stripeCustomerId" TEXT;
ALTER TABLE "AccountSettings" ADD COLUMN "stripeSubscriptionId" TEXT;
ALTER TABLE "AccountSettings" ADD COLUMN "subscriptionPlan" TEXT;
ALTER TABLE "AccountSettings" ADD COLUMN "subscriptionStatus" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "AccountSettings_stripeCustomerId_key" ON "AccountSettings"("stripeCustomerId");
CREATE UNIQUE INDEX "AccountSettings_stripeSubscriptionId_key" ON "AccountSettings"("stripeSubscriptionId");
