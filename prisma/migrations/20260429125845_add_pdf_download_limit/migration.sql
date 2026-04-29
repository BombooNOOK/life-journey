-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "pdfDownloadCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "pdfDownloadLimit" INTEGER NOT NULL DEFAULT 3;
