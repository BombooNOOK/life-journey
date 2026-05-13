-- AlterTable
ALTER TABLE "JournalEntry" ALTER COLUMN "designTheme" SET DEFAULT 'simple';

UPDATE "JournalEntry" SET "designTheme" = 'simple' WHERE "designTheme" = 'cute';
UPDATE "JournalEntry" SET "designTheme" = 'simple_plain' WHERE "designTheme" = 'cute_plain';

UPDATE "DiaryBookshelfBook" SET "coverTheme" = 'simple' WHERE "coverTheme" = 'cute';
UPDATE "DiaryBookshelfBook" SET "coverTheme" = 'simple_plain' WHERE "coverTheme" = 'cute_plain';
