import { prisma } from "@/lib/db";
import { serializeDiaryBook, type DiaryBookDto } from "@/lib/journal/diaryBookDto";
import { diaryBookTagScopeFromRow } from "@/lib/journal/diaryBookTagFilter";
import {
  countDiaryBookSnapshotEntries,
  diaryBookNeedsContentRefresh,
} from "@/lib/journal/diaryBookSnapshot";
import {
  diaryIdentityOrExplicitEmailWhere,
  shouldUseDiaryIdentityRead,
} from "@/lib/diary/diaryIdentityAuthority";
import { resolveP0IdentityReadAccess } from "@/lib/account/p0IdentityReadContract";
import { resolveValueIdentityOwnership } from "@/lib/value/valueIdentityOwnership";

export async function listDiaryBooksForViewer(params: {
  email: string;
  profileId: string;
}): Promise<DiaryBookDto[]> {
  let rows;

  if (shouldUseDiaryIdentityRead()) {
    const ownership = await resolveValueIdentityOwnership();
    const access = await resolveP0IdentityReadAccess(ownership);
    if (!access.ok) return [];
    const where = diaryIdentityOrExplicitEmailWhere({
      identityId: access.identityId,
      explicitHistoricalEmails: access.explicitHistoricalEmails,
      profileId: params.profileId,
    });
    rows = await prisma.diaryBook.findMany({
      where,
      orderBy: { createdAt: "desc" },
    });
  } else {
    rows = await prisma.diaryBook.findMany({
      where: { email: params.email, profileId: params.profileId },
      orderBy: { createdAt: "desc" },
    });
  }

  return Promise.all(
    rows.map(async (row) => {
      const tagScope = diaryBookTagScopeFromRow(row);
      const [entryCount, needsContentRefresh] = await Promise.all([
        countDiaryBookSnapshotEntries({
          email: row.email,
          profileId: row.profileId,
          startDate: row.startDate,
          endDate: row.endDate,
          bookUpdatedAt: row.updatedAt,
          tagScope,
        }),
        diaryBookNeedsContentRefresh({
          email: row.email,
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
