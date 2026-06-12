/**
 * ローカル DB 向け DiaryBook Phase A スモーク（API ロジック相当）。
 * DiaryBook を作成・削除するため本番 Neon では実行しないこと。
 *
 * 実行: npx tsx scripts/verify-diary-book-phase-a.ts
 * （DATABASE_URL は .env.local のローカル Postgres を推奨）
 */
import { PrismaClient } from "@prisma/client";

import { requireSafeDatabaseUrl } from "./lib/safe-database-url";
import { parseDiaryBookCreateFields } from "../src/lib/journal/diaryBookForm";
import {
  countJournalEntriesInDiaryBookPeriod,
  parseDiaryBookDateRange,
} from "../src/lib/journal/diaryBookPeriod";

const prisma = new PrismaClient();

async function main() {
  requireSafeDatabaseUrl({
    scriptName: "verify-diary-book-phase-a.ts",
    mutatesDatabase: true,
  });

  const email = "heartfresh4119@gmail.com";
  const profile = await prisma.profile.findFirst({
    where: { email, isArchived: false },
    select: { id: true },
  });
  if (!profile) {
    throw new Error("Test profile not found for smoke test");
  }

  const startDate = "2020-01-01";
  const endDate = "2030-12-31";
  const range = parseDiaryBookDateRange(startDate, endDate);
  if (!range) throw new Error("date range parse failed");

  const entryCount = await countJournalEntriesInDiaryBookPeriod({
    email,
    profileId: profile.id,
    startDate,
    endDate,
  });
  console.log("entryCount in wide range:", entryCount);

  const emptyRange = parseDiaryBookDateRange("2099-01-01", "2099-01-02");
  if (!emptyRange) throw new Error("empty range parse failed");
  const emptyCount = await countJournalEntriesInDiaryBookPeriod({
    email,
    profileId: profile.id,
    startDate: emptyRange.startDate,
    endDate: emptyRange.endDate,
  });
  console.log("entryCount in empty range:", emptyCount);
  if (emptyCount !== 0) throw new Error("expected 0 entries in 2099");

  const parsed = parseDiaryBookCreateFields({
    title: "Phase A smoke",
    startDate,
    endDate,
    coverTheme: "casual",
  });
  if (!parsed.ok) throw new Error(`parse failed: ${parsed.error}`);

  if (entryCount > 0) {
    const created = await prisma.diaryBook.create({
      data: {
        email,
        profileId: profile.id,
        title: parsed.data.title,
        startDate: parsed.data.startDate,
        endDate: parsed.data.endDate,
        coverTheme: parsed.data.coverTheme,
      },
    });
    console.log("created book id:", created.id);

    const listed = await prisma.diaryBook.findMany({
      where: { email, profileId: profile.id },
      orderBy: { createdAt: "desc" },
      take: 1,
    });
    console.log("list head title:", listed[0]?.title);

    await prisma.diaryBook.delete({ where: { id: created.id } });
    console.log("cleaned up smoke book");
  } else {
    console.log("skip create smoke (no entries in range)");
  }

  console.log("verify-diary-book-phase-a: OK");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
