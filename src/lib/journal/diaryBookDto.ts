import type { DiaryBook } from "@prisma/client";

export type DiaryBookDto = {
  id: string;
  title: string;
  startDate: string;
  endDate: string;
  coverTheme: string;
  entryCount: number;
  createdAt: string;
};

export function serializeDiaryBook(row: DiaryBook, entryCount: number): DiaryBookDto {
  return {
    id: row.id,
    title: row.title,
    startDate: row.startDate,
    endDate: row.endDate,
    coverTheme: row.coverTheme,
    entryCount,
    createdAt: row.createdAt.toISOString(),
  };
}
