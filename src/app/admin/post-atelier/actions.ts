"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { isAdminEmail } from "@/lib/admin/access";
import { parseSocialPostDraftFormData } from "@/lib/admin/post-atelier/validation";
import { getViewerEmailFromCookie } from "@/lib/auth/viewer";
import { prisma } from "@/lib/db";

const POST_ATELIER_PATHS = [
  "/admin/post-atelier",
  "/admin/post-atelier/posts",
  "/admin/post-atelier/calendar",
] as const;

function revalidatePostAtelierPaths(draftId?: string, postType?: string): void {
  for (const path of POST_ATELIER_PATHS) {
    try {
      revalidatePath(path);
    } catch (e) {
      console.warn("[post-atelier] revalidatePath", path, e);
    }
  }
  if (draftId) {
    try {
      revalidatePath(`/admin/post-atelier/${draftId}`);
    } catch (e) {
      console.warn("[post-atelier] revalidatePath draft", draftId, e);
    }
    if (postType === "daily_number") {
      try {
        revalidatePath(`/admin/post-atelier/daily-number/${draftId}`);
      } catch (e) {
        console.warn("[post-atelier] revalidatePath daily-number", draftId, e);
      }
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

export async function createSocialPostDraft(formData: FormData) {
  const viewer = await requireAdminOrRedirect("/admin/post-atelier/new");
  const parsed = parseSocialPostDraftFormData(formData);
  if (!parsed.ok) {
    redirectWithError("/admin/post-atelier/new", parsed.error);
  }

  const row = await prisma.socialPostDraft.create({
    data: {
      ...parsed.data,
      authorEmail: viewer,
    },
  });

  revalidatePostAtelierPaths(row.id);
  redirect(`/admin/post-atelier/${row.id}?saved=1`);
}

export async function updateSocialPostDraft(formData: FormData) {
  const id = formData.get("id")?.toString() ?? "";
  if (!id) {
    redirectWithError("/admin/post-atelier/posts", "ID が不正です。");
  }

  const viewer = await requireAdminOrRedirect(`/admin/post-atelier/${id}`);
  const parsed = parseSocialPostDraftFormData(formData);
  if (!parsed.ok) {
    redirectWithError(`/admin/post-atelier/${id}`, parsed.error);
  }

  const existing = await prisma.socialPostDraft.findUnique({ where: { id }, select: { id: true } });
  if (!existing) {
    redirectWithError("/admin/post-atelier/posts", "投稿案が見つかりません。");
  }

  await prisma.socialPostDraft.update({
    where: { id },
    data: {
      ...parsed.data,
      authorEmail: viewer,
    },
  });

  revalidatePostAtelierPaths(id);
  redirect(`/admin/post-atelier/${id}?saved=1`);
}

export async function deleteSocialPostDraft(formData: FormData) {
  const id = formData.get("id")?.toString() ?? "";
  if (!id) {
    redirectWithError("/admin/post-atelier/posts", "ID が不正です。");
  }

  await requireAdminOrRedirect("/admin/post-atelier/posts");

  const existing = await prisma.socialPostDraft.findUnique({
    where: { id },
    select: { id: true, postType: true },
  });
  if (!existing) {
    redirectWithError("/admin/post-atelier/posts", "投稿案が見つかりません。");
  }

  await prisma.socialPostDraft.delete({ where: { id } });

  revalidatePostAtelierPaths(id, existing.postType);
  redirect("/admin/post-atelier/posts?deleted=1");
}
