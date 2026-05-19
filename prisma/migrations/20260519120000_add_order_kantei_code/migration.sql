-- AlterTable
ALTER TABLE "Order" ADD COLUMN "kanteiCode" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Order_kanteiCode_key" ON "Order"("kanteiCode");
