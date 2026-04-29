-- CreateTable
CREATE TABLE "Order" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "lastName" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastNameKana" TEXT NOT NULL,
    "firstNameKana" TEXT NOT NULL,
    "lastNameRoman" TEXT NOT NULL,
    "firstNameRoman" TEXT NOT NULL,
    "fullNameDisplay" TEXT NOT NULL,
    "fullNameKanaDisplay" TEXT NOT NULL,
    "fullNameRomanDisplay" TEXT NOT NULL,
    "birthDate" TEXT NOT NULL,
    "birthYear" INTEGER NOT NULL,
    "birthMonth" INTEGER NOT NULL,
    "birthDay" INTEGER NOT NULL,
    "postalCode" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "numerologyJson" TEXT NOT NULL,
    "stonesJson" TEXT NOT NULL,
    "stoneFocusTheme" TEXT NOT NULL DEFAULT '特に決まっていない',
    "reportPdfPath" TEXT,
    "expectedNumerologyJson" TEXT,
    "status" TEXT NOT NULL DEFAULT 'draft',

    CONSTRAINT "Order_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "JournalEntry" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "email" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "mood" TEXT NOT NULL DEFAULT 'calm',
    "activity" TEXT NOT NULL DEFAULT 'record_anyway',
    "companionType" TEXT NOT NULL DEFAULT 'owl',
    "designTheme" TEXT NOT NULL DEFAULT 'cute',
    "photoDataUrl" TEXT,
    "generatedComment" TEXT,
    "includeInBook" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "JournalEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DiaryBookshelfBook" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "email" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "displayTitle" TEXT,
    "coverTheme" TEXT NOT NULL DEFAULT 'simple',
    "periodStartMonth" INTEGER NOT NULL DEFAULT 1,
    "periodEndMonth" INTEGER NOT NULL DEFAULT 12,

    CONSTRAINT "DiaryBookshelfBook_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "DiaryBookshelfBook_email_year_key" ON "DiaryBookshelfBook"("email", "year");
