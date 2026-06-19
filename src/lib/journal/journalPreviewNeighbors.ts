import { formatJournalListDayLabel } from "@/lib/journal/journalListDisplay";
import { prisma } from "@/lib/db";

export type JournalPreviewNeighbor = {
  id: string;
  dayLabel: string;
};

export type JournalPreviewNeighbors = {
  prev: JournalPreviewNeighbor | null;
  next: JournalPreviewNeighbor | null;
};

function toNeighbor(row: { id: string; createdAt: Date }): JournalPreviewNeighbor {
  return {
    id: row.id,
    dayLabel: formatJournalListDayLabel(row.createdAt.toISOString()),
  };
}

/** プレビュー画面：同プロフィール内の前後の記録 */
export async function findJournalPreviewNeighbors(input: {
  viewerEmail: string;
  entryId: string;
  profileId: string;
  createdAt: Date;
}): Promise<JournalPreviewNeighbors> {
  const baseWhere = {
    email: input.viewerEmail,
    profileId: input.profileId,
  };

  const [prevRow, nextRow] = await Promise.all([
    prisma.journalEntry.findFirst({
      where: {
        ...baseWhere,
        OR: [
          { createdAt: { lt: input.createdAt } },
          { createdAt: input.createdAt, id: { lt: input.entryId } },
        ],
      },
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      select: { id: true, createdAt: true },
    }),
    prisma.journalEntry.findFirst({
      where: {
        ...baseWhere,
        OR: [
          { createdAt: { gt: input.createdAt } },
          { createdAt: input.createdAt, id: { gt: input.entryId } },
        ],
      },
      orderBy: [{ createdAt: "asc" }, { id: "asc" }],
      select: { id: true, createdAt: true },
    }),
  ]);

  return {
    prev: prevRow ? toNeighbor(prevRow) : null,
    next: nextRow ? toNeighbor(nextRow) : null,
  };
}
