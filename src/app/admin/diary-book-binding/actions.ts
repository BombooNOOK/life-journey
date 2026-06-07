"use server";

import { revalidatePath } from "next/cache";

import { isAdminEmail } from "@/lib/admin/access";
import { canAdminWithdrawPending } from "@/lib/commerce/diaryBookBindingPendingLifecycle";
import { isDiaryBookBindingStatus } from "@/lib/commerce/diaryBookBindingStatus";
import { getViewerEmailFromCookie } from "@/lib/auth/viewer";
import { prisma } from "@/lib/db";

async function requireAdmin() {
  const viewer = await getViewerEmailFromCookie();
  if (!(await isAdminEmail(viewer))) {
    throw new Error("管理者権限が必要です。");
  }
  return viewer;
}

export async function updateDiaryBookBindingRequest(formData: FormData) {
  await requireAdmin();

  const id = formData.get("id")?.toString() ?? "";
  if (!id) throw new Error("ID が不正です。");

  const statusRaw = formData.get("status")?.toString() ?? "";
  const baseOrderNumber = formData.get("baseOrderNumber")?.toString().trim() || null;
  const baseBuyerName = formData.get("baseBuyerName")?.toString().trim() || null;

  const data: {
    baseOrderNumber: string | null;
    baseBuyerName: string | null;
    status?: string;
  } = {
    baseOrderNumber,
    baseBuyerName,
  };

  if (statusRaw && isDiaryBookBindingStatus(statusRaw)) {
    data.status = statusRaw;
  }

  await prisma.diaryBookBindingRequest.update({
    where: { id },
    data,
  });

  revalidatePath("/admin/diary-book-binding");
}

export async function withdrawDiaryBookBindingRequest(formData: FormData) {
  const viewer = await requireAdmin();

  const id = formData.get("id")?.toString() ?? "";
  if (!id) throw new Error("ID が不正です。");

  const row = await prisma.diaryBookBindingRequest.findUnique({ where: { id } });
  if (!row) throw new Error("申込予定が見つかりません。");
  if (!canAdminWithdrawPending(row)) {
    throw new Error("BASE注文番号が入っている、または pending 以外の申込は取り下げできません。");
  }

  await prisma.diaryBookBindingRequest.update({
    where: { id },
    data: {
      status: "cancelled",
      cancelledAt: new Date(),
      cancelledBy: viewer ?? "admin",
      cancelReason: "管理者による取り下げ",
    },
  });

  revalidatePath("/admin/diary-book-binding");
}
