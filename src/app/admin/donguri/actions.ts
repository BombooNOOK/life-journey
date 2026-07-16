"use server";

import { revalidatePath } from "next/cache";

import { isAdminEmail } from "@/lib/admin/access";
import { getViewerEmailFromCookie, normalizeEmail } from "@/lib/auth/viewer";
import { grantDonguriByAdmin } from "@/lib/loghouse/donguriLedger";

export type AdminDonguriGrantState = {
  ok: boolean;
  message: string;
};

export async function adminGrantDonguriAction(
  _prev: AdminDonguriGrantState,
  formData: FormData,
): Promise<AdminDonguriGrantState> {
  const viewerEmail = await getViewerEmailFromCookie();
  if (!(await isAdminEmail(viewerEmail))) {
    return { ok: false, message: "管理者のみ実行できます。" };
  }

  const email = normalizeEmail(String(formData.get("email") ?? ""));
  const profileId = String(formData.get("profileId") ?? "").trim();
  const amount = Number(formData.get("amount"));
  const description = String(formData.get("description") ?? "").trim();
  const notifyMailbox = String(formData.get("notifyMailbox") ?? "") === "1";
  const confirmed = String(formData.get("confirmed") ?? "") === "1";

  if (!confirmed) {
    return { ok: false, message: "確認にチェックを入れてください。" };
  }
  if (!email || !profileId) {
    return { ok: false, message: "メールとプロフィールが必要です。" };
  }
  if (!Number.isFinite(amount) || amount === 0) {
    return { ok: false, message: "付与数は 0 以外の整数にしてください。" };
  }

  try {
    await grantDonguriByAdmin({
      email,
      profileId,
      amount: Math.trunc(amount),
      description: description || "管理者からのおとどけ",
      notifyMailbox,
    });
    revalidatePath(`/admin/donguri/${encodeURIComponent(email)}`);
    revalidatePath("/admin");
    return { ok: true, message: "どんぐりを付与しました。" };
  } catch (e) {
    console.error("[adminGrantDonguriAction]", e);
    return {
      ok: false,
      message: e instanceof Error ? e.message : "付与に失敗しました。",
    };
  }
}
