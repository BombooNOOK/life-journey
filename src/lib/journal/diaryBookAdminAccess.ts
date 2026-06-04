import type { DiaryBook } from "@prisma/client";

import { isAdminEmail } from "@/lib/admin/access";
import { prisma } from "@/lib/db";
import { resolveActiveProfileId } from "@/lib/profile/activeProfile";

/** 本人（閲覧中プロフィール）または管理者 read-only 閲覧用に DiaryBook 1件を取得 */
export async function findDiaryBookRowForViewerOrAdmin(params: {
  bookId: string;
  viewerEmail: string;
}): Promise<DiaryBook | null> {
  const trimmedId = params.bookId.trim();
  if (!trimmedId) return null;

  if (await isAdminEmail(params.viewerEmail)) {
    return prisma.diaryBook.findFirst({ where: { id: trimmedId } });
  }

  const activeProfileId = await resolveActiveProfileId(params.viewerEmail);
  if (!activeProfileId) return null;

  return prisma.diaryBook.findFirst({
    where: {
      id: trimmedId,
      email: params.viewerEmail,
      profileId: activeProfileId,
    },
  });
}
