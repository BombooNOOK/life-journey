import type { DiaryBook } from "@prisma/client";

export type DiaryBookDto = {
  id: string;
  title: string;
  startDate: string;
  endDate: string;
  coverTheme: string;
  entryCount: number;
  createdAt: string;
  updatedAt: string;
  needsContentRefresh?: boolean;
};

export function serializeDiaryBook(
  row: DiaryBook,
  entryCount: number,
  extras?: { needsContentRefresh?: boolean },
): DiaryBookDto {
  return {
    id: row.id,
    title: row.title,
    startDate: row.startDate,
    endDate: row.endDate,
    coverTheme: row.coverTheme,
    entryCount,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
    ...(extras?.needsContentRefresh != null
      ? { needsContentRefresh: extras.needsContentRefresh }
      : {}),
  };
}
