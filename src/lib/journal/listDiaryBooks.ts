import { prisma } from "@/lib/db";
import { serializeDiaryBook, type DiaryBookDto } from "@/lib/journal/diaryBookDto";
import { countJournalEntriesInDiaryBookPeriod } from "@/lib/journal/diaryBookPeriod";

export async function listDiaryBooksForViewer(params: {
  email: string;
  profileId: string;
}): Promise<DiaryBookDto[]> {
  const rows = await prisma.diaryBook.findMany({
    where: { email: params.email, profileId: params.profileId },
    orderBy: { createdAt: "desc" },
  });

  return Promise.all(
    rows.map(async (row) => {
      const entryCount = await countJournalEntriesInDiaryBookPeriod({
        email: params.email,
        profileId: row.profileId,
        startDate: row.startDate,
        endDate: row.endDate,
      });
      return serializeDiaryBook(row, entryCount);
    }),
  );
}
