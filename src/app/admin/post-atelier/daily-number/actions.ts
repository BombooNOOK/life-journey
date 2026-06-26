"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { isAdminEmail } from "@/lib/admin/access";
import { getViewerEmailFromCookie } from "@/lib/auth/viewer";
import { prisma } from "@/lib/db";
import { DAILY_NUMBER_SERIES_TITLE } from "@/lib/admin/post-atelier/daily-number/pageLayout";
import { resolveDailyNumberPost } from "@/lib/admin/post-atelier/daily-number/resolveDailyNumberPost";
import { parseDailyNumberDraftFormData } from "@/lib/admin/post-atelier/daily-number/validation";

function revalidateDailyNumberPaths(draftId?: string): void {
  const paths = [
    "/admin/post-atelier",
    "/admin/post-atelier/posts",
    "/admin/post-atelier/calendar",
    "/admin/post-atelier/daily-number/new",
  ];
  for (const path of paths) {
    try {
      revalidatePath(path);
    } catch (e) {
      console.warn("[daily-number] revalidatePath", path, e);
    }
  }
  if (draftId) {
    try {
      revalidatePath(`/admin/post-atelier/daily-number/${draftId}`);
    } catch (e) {
      console.warn("[daily-number] revalidatePath draft", draftId, e);
    }
  }
}

async function requireAdminOrRedirect(returnTo: string): Promise<string> {
  const viewer = await getViewerEmailFromCookie();
  if (!viewer) {
    redirect(`/login?returnTo=${encodeURIComponent(returnTo)}`);
  }
  if (!(await isAdminEmail(viewer))) {
    redirect("/orders");
  }
  return viewer;
}

function redirectWithError(path: string, error: string): never {
  redirect(`${path}?err=${encodeURIComponent(error)}`);
}

export async function createDailyNumberPost(formData: FormData) {
  const viewer = await requireAdminOrRedirect("/admin/post-atelier/daily-number/new");
  const parsed = parseDailyNumberDraftFormData(formData);
  if (!parsed.ok) {
    redirectWithError("/admin/post-atelier/daily-number/new", parsed.error);
  }

  const resolved = resolveDailyNumberPost({
    scheduledDate: parsed.data.scheduledDate,
    todayNumber: parsed.data.todayNumber,
    character: parsed.data.companionType,
    messageType: parsed.data.messageType,
    coverVariantMode: parsed.data.coverVariantMode,
    lockedVariant: parsed.data.lockedVariant,
    lockedClosingVariant: parsed.data.lockedClosingVariant,
  });

  if (!resolved.ok) {
    redirectWithError(
      "/admin/post-atelier/daily-number/new",
      "この今日のすうじのデータは準備中です。フクロウ先生 × base の表紙・個別ページが揃っているか確認してください。",
    );
  }

  const theme = `${DAILY_NUMBER_SERIES_TITLE}（すうじ${resolved.payload.todayNumber}）`;

  const row = await prisma.socialPostDraft.create({
    data: {
      authorEmail: viewer,
      postType: "daily_number",
      theme,
      companionType: parsed.data.companionType,
      platform: "instagram",
      scheduledDate: parsed.data.scheduledDate,
      todayNumber: resolved.payload.todayNumber,
      messageType: parsed.data.messageType,
      status: parsed.data.status,
      internalMemo: parsed.data.internalMemo,
      bodyText: resolved.canvaCopyText,
      captionText: resolved.captionText,
      generatedPayload: JSON.stringify(resolved.payload),
      hashtags: "",
    },
  });

  revalidateDailyNumberPaths(row.id);
  redirect(`/admin/post-atelier/daily-number/${row.id}?saved=1`);
}

export async function updateDailyNumberPost(formData: FormData) {
  const id = formData.get("id")?.toString() ?? "";
  if (!id) {
    redirectWithError("/admin/post-atelier/posts", "ID が不正です。");
  }

  const viewer = await requireAdminOrRedirect(`/admin/post-atelier/daily-number/${id}`);
  const parsed = parseDailyNumberDraftFormData(formData);
  if (!parsed.ok) {
    redirectWithError(`/admin/post-atelier/daily-number/${id}`, parsed.error);
  }

  const existing = await prisma.socialPostDraft.findUnique({
    where: { id },
    select: { id: true, postType: true },
  });
  if (!existing || existing.postType !== "daily_number") {
    redirectWithError("/admin/post-atelier/posts", "投稿案が見つかりません。");
  }

  const resolved = resolveDailyNumberPost({
    scheduledDate: parsed.data.scheduledDate,
    todayNumber: parsed.data.todayNumber,
    character: parsed.data.companionType,
    messageType: parsed.data.messageType,
    coverVariantMode: parsed.data.coverVariantMode,
    lockedVariant: parsed.data.lockedVariant,
    lockedClosingVariant: parsed.data.lockedClosingVariant,
  });

  if (!resolved.ok) {
    redirectWithError(
      `/admin/post-atelier/daily-number/${id}`,
      "この今日のすうじのデータは準備中です。フクロウ先生 × base の表紙・個別ページが揃っているか確認してください。",
    );
  }

  const theme = `${DAILY_NUMBER_SERIES_TITLE}（すうじ${resolved.payload.todayNumber}）`;

  await prisma.socialPostDraft.update({
    where: { id },
    data: {
      authorEmail: viewer,
      theme,
      companionType: parsed.data.companionType,
      scheduledDate: parsed.data.scheduledDate,
      todayNumber: resolved.payload.todayNumber,
      messageType: parsed.data.messageType,
      status: parsed.data.status,
      internalMemo: parsed.data.internalMemo,
      bodyText: resolved.canvaCopyText,
      captionText: resolved.captionText,
      generatedPayload: JSON.stringify(resolved.payload),
    },
  });

  revalidateDailyNumberPaths(id);
  redirect(`/admin/post-atelier/daily-number/${id}?saved=1`);
}
