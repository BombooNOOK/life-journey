-- CreateTable
CREATE TABLE "KanteiBookBindingRequest" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "orderId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "profileId" TEXT NOT NULL DEFAULT '',
    "status" TEXT NOT NULL DEFAULT 'pending',
    "baseOrderNumber" TEXT,
    "baseBuyerName" TEXT,
    "kanteiCode" TEXT NOT NULL,
    "fullNameDisplay" TEXT NOT NULL,
    "birthDate" TEXT NOT NULL,
    "orderCreatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "KanteiBookBindingRequest_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "KanteiBookBindingRequest_status_createdAt_idx" ON "KanteiBookBindingRequest"("status", "createdAt");

-- CreateIndex
CREATE INDEX "KanteiBookBindingRequest_orderId_idx" ON "KanteiBookBindingRequest"("orderId");

-- CreateIndex
CREATE INDEX "KanteiBookBindingRequest_email_idx" ON "KanteiBookBindingRequest"("email");

-- CreateIndex
CREATE INDEX "KanteiBookBindingRequest_kanteiCode_idx" ON "KanteiBookBindingRequest"("kanteiCode");
