-- AlterTable
ALTER TABLE "SocialPostDraft" ADD COLUMN     "postType" TEXT NOT NULL DEFAULT 'generic',
ADD COLUMN     "messageType" TEXT NOT NULL DEFAULT 'base',
ADD COLUMN     "generatedPayload" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "captionText" TEXT NOT NULL DEFAULT '';
