-- AlterTable
ALTER TABLE "Order" ADD COLUMN "pdfPreviewBlobUrl" TEXT,
ADD COLUMN "pdfPreviewCacheKey" TEXT,
ADD COLUMN "pdfPrintBlobUrl" TEXT,
ADD COLUMN "pdfPrintCacheKey" TEXT;
