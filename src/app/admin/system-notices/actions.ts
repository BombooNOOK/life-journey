"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { isAdminEmail } from "@/lib/admin/access";
import { getViewerEmailFromCookie } from "@/lib/auth/viewer";
import {
  createSystemNoticeDraft,
  publishSystemNotice,
  sendIndividualForestMailboxNotice,
  unpublishSystemNotice,
  updateSystemNoticeDraft,
} from "@/lib/loghouse/systemNotices";

const LIST_PATH = "/admin/system-notices";

function revalidateSystemNoticePaths(id?: string): void {
  try {
    revalidatePath(LIST_PATH);
  } catch (e) {
    console.warn("[system-notices] revalidatePath list", e);
  }
  try {
    revalidatePath("/orders/mailbox");
  } catch (e) {
    console.warn("[system-notices] revalidatePath mailbox", e);
  }
  if (id) {
    try {
      revalidatePath(`${LIST_PATH}/${id}`);
    } catch (e) {
      console.warn("[system-notices] revalidatePath detail", e);
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

function readUpsertFields(formData: FormData) {
  return {
    title: formData.get("title")?.toString() ?? "",
    body: formData.get("body")?.toString() ?? "",
    actionLabel: formData.get("actionLabel")?.toString() ?? "",
    actionRoute: formData.get("actionRoute")?.toString() ?? "",
  };
}

export async function createSystemNoticeAction(formData: FormData) {
  const viewer = await requireAdminOrRedirect(`${LIST_PATH}/new`);
  try {
    const fields = readUpsertFields(formData);
    const row = await createSystemNoticeDraft({
      ...fields,
      authorEmail: viewer,
    });
    revalidateSystemNoticePaths(row.id);
    redirect(`${LIST_PATH}/${row.id}?saved=1`);
  } catch (e) {
    if (e && typeof e === "object" && "digest" in e) throw e;
    const message = e instanceof Error ? e.message : "作成に失敗しました。";
    redirect(`${LIST_PATH}/new?err=${encodeURIComponent(message)}`);
  }
}

export async function updateSystemNoticeAction(formData: FormData) {
  const id = formData.get("id")?.toString() ?? "";
  if (!id) {
    redirect(`${LIST_PATH}?err=${encodeURIComponent("ID が不正です。")}`);
  }
  await requireAdminOrRedirect(`${LIST_PATH}/${id}`);
  try {
    const fields = readUpsertFields(formData);
    await updateSystemNoticeDraft(id, fields);
    revalidateSystemNoticePaths(id);
    redirect(`${LIST_PATH}/${id}?saved=1`);
  } catch (e) {
    if (e && typeof e === "object" && "digest" in e) throw e;
    const message = e instanceof Error ? e.message : "保存に失敗しました。";
    redirect(`${LIST_PATH}/${id}?err=${encodeURIComponent(message)}`);
  }
}

export async function publishSystemNoticeAction(formData: FormData) {
  const id = formData.get("id")?.toString() ?? "";
  if (!id) {
    redirect(`${LIST_PATH}?err=${encodeURIComponent("ID が不正です。")}`);
  }
  await requireAdminOrRedirect(`${LIST_PATH}/${id}`);
  try {
    // 公開前にフォーム内容も保存
    const fields = readUpsertFields(formData);
    if (fields.title.trim() || fields.body.trim()) {
      await updateSystemNoticeDraft(id, fields);
    }
    await publishSystemNotice(id);
    revalidateSystemNoticePaths(id);
    redirect(`${LIST_PATH}/${id}?saved=published`);
  } catch (e) {
    if (e && typeof e === "object" && "digest" in e) throw e;
    const message = e instanceof Error ? e.message : "公開に失敗しました。";
    redirect(`${LIST_PATH}/${id}?err=${encodeURIComponent(message)}`);
  }
}

export async function unpublishSystemNoticeAction(formData: FormData) {
  const id = formData.get("id")?.toString() ?? "";
  if (!id) {
    redirect(`${LIST_PATH}?err=${encodeURIComponent("ID が不正です。")}`);
  }
  await requireAdminOrRedirect(`${LIST_PATH}/${id}`);
  try {
    await unpublishSystemNotice(id);
    revalidateSystemNoticePaths(id);
    redirect(`${LIST_PATH}/${id}?saved=unpublished`);
  } catch (e) {
    if (e && typeof e === "object" && "digest" in e) throw e;
    const message = e instanceof Error ? e.message : "非公開に失敗しました。";
    redirect(`${LIST_PATH}/${id}?err=${encodeURIComponent(message)}`);
  }
}

export async function sendIndividualSystemNoticeAction(formData: FormData) {
  const returnBase = `${LIST_PATH}/individual`;
  await requireAdminOrRedirect(returnBase);

  const email = formData.get("email")?.toString() ?? "";
  const profileId = formData.get("profileId")?.toString() ?? "";
  const confirmed = formData.get("confirmed")?.toString() === "1";
  const fields = readUpsertFields(formData);

  if (!confirmed) {
    redirect(
      `${returnBase}?email=${encodeURIComponent(email)}&err=${encodeURIComponent(
        "送信内容の確認にチェックを入れてください。",
      )}`,
    );
  }

  try {
    const result = await sendIndividualForestMailboxNotice({
      email,
      profileId,
      ...fields,
    });
    revalidateSystemNoticePaths();
    redirect(
      `${returnBase}?email=${encodeURIComponent(result.email)}&saved=1&noticeId=${encodeURIComponent(result.noticeId)}`,
    );
  } catch (e) {
    if (e && typeof e === "object" && "digest" in e) throw e;
    const message = e instanceof Error ? e.message : "個別送信に失敗しました。";
    redirect(
      `${returnBase}?email=${encodeURIComponent(email)}&err=${encodeURIComponent(message)}`,
    );
  }
}
