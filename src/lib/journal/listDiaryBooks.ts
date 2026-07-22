import { prisma } from "@/lib/db";
import { serializeDiaryBook, type DiaryBookDto } from "@/lib/journal/diaryBookDto";
import { diaryBookTagScopeFromRow } from "@/lib/journal/diaryBookTagFilter";
import {
  countDiaryBookSnapshotEntries,
  diaryBookNeedsContentRefresh,
} from "@/lib/journal/diaryBookSnapshot";

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
      const tagScope = diaryBookTagScopeFromRow(row);
      const [entryCount, needsContentRefresh] = await Promise.all([
        countDiaryBookSnapshotEntries({
          email: params.email,
          profileId: row.profileId,
          startDate: row.startDate,
          endDate: row.endDate,
          bookUpdatedAt: row.updatedAt,
          tagScope,
        }),
        diaryBookNeedsContentRefresh({
          email: params.email,
          profileId: row.profileId,
          startDate: row.startDate,
          endDate: row.endDate,
          bookUpdatedAt: row.updatedAt,
        }),
      ]);
      return serializeDiaryBook(row, entryCount, { needsContentRefresh });
    }),
  );
}
