import type { DiaryBook } from "@prisma/client";

import type { DiaryBookTagFilterMode } from "@/lib/journal/diaryTags";

export type DiaryBookDto = {
  id: string;
  title: string;
  startDate: string;
  endDate: string;
  coverTheme: string;
  pageTemplate: string;
  tagFilter: string;
  tagFilterMode: DiaryBookTagFilterMode;
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
    pageTemplate: row.pageTemplate ?? "suuji_ashiato_irodori",
    tagFilter: row.tagFilter ?? "",
    tagFilterMode: (row.tagFilterMode === "OR" ? "OR" : "AND") as DiaryBookTagFilterMode,
    entryCount,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
    ...(extras?.needsContentRefresh != null
      ? { needsContentRefresh: extras.needsContentRefresh }
      : {}),
  };
}
