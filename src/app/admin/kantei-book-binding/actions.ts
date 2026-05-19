"use server";

import { revalidatePath } from "next/cache";

import { isAdminEmail } from "@/lib/admin/access";
import { isKanteiBookBindingStatus } from "@/lib/commerce/kanteiBookBindingStatus";
import { getViewerEmailFromCookie } from "@/lib/auth/viewer";
import { prisma } from "@/lib/db";

async function requireAdmin() {
  const viewer = await getViewerEmailFromCookie();
  if (!(await isAdminEmail(viewer))) {
    throw new Error("管理者権限が必要です。");
  }
}

export async function updateKanteiBookBindingRequest(formData: FormData) {
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

  if (statusRaw && isKanteiBookBindingStatus(statusRaw)) {
    data.status = statusRaw;
  }

  await prisma.kanteiBookBindingRequest.update({
    where: { id },
    data,
  });

  revalidatePath("/admin/kantei-book-binding");
}
