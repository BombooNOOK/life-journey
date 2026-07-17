"use server";

import { revalidatePath } from "next/cache";

import { isAdminEmail } from "@/lib/admin/access";
import { getViewerEmailFromCookie, normalizeEmail } from "@/lib/auth/viewer";
import {
  adjustDonguriByAdmin,
  adjustDonguriByAdminToTarget,
  grantDonguriByAdmin,
} from "@/lib/loghouse/donguriLedger";

export type AdminDonguriGrantState = {
  ok: boolean;
  message: string;
};

export type AdminDonguriAdjustState = {
  ok: boolean;
  message: string;
  previousBalance?: number;
  nextBalance?: number;
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

export async function adminAdjustDonguriAction(
  _prev: AdminDonguriAdjustState,
  formData: FormData,
): Promise<AdminDonguriAdjustState> {
  const viewerEmail = await getViewerEmailFromCookie();
  if (!(await isAdminEmail(viewerEmail))) {
    return { ok: false, message: "管理者のみ実行できます。" };
  }

  const email = normalizeEmail(String(formData.get("email") ?? ""));
  const profileId = String(formData.get("profileId") ?? "").trim();
  const mode = String(formData.get("mode") ?? "delta").trim();
  const amountRaw = String(formData.get("amount") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const confirmed = String(formData.get("confirmed") ?? "") === "1";

  if (!confirmed) {
    return { ok: false, message: "確認ダイアログで「調整する」を選んでください。" };
  }
  if (!email || !profileId) {
    return { ok: false, message: "メールとプロフィールが必要です。" };
  }

  try {
    if (mode === "set_to_2") {
      const result = await adjustDonguriByAdminToTarget({
        email,
        profileId,
        targetBalance: 2,
        description: description || "不足時導線確認のため",
      });
      revalidatePath(`/admin/donguri/${encodeURIComponent(email)}`);
      revalidatePath("/admin");
      return {
        ok: true,
        message: `残高を ${result.previousBalance}こ → ${result.nextBalance}こ に調整しました（${result.entry.delta > 0 ? "+" : ""}${result.entry.delta}）。`,
        previousBalance: result.previousBalance,
        nextBalance: result.nextBalance,
      };
    }

    const amount = Number(amountRaw);
    if (!Number.isFinite(amount) || amount === 0) {
      return { ok: false, message: "調整数は 0 以外の整数にしてください（例: +10 / -48）。" };
    }

    const result = await adjustDonguriByAdmin({
      email,
      profileId,
      amount: Math.trunc(amount),
      description: description || null,
    });
    revalidatePath(`/admin/donguri/${encodeURIComponent(email)}`);
    revalidatePath("/admin");
    return {
      ok: true,
      message: `調整しました（${result.previousBalance}こ → ${result.nextBalance}こ）。`,
      previousBalance: result.previousBalance,
      nextBalance: result.nextBalance,
    };
  } catch (e) {
    console.error("[adminAdjustDonguriAction]", e);
    return {
      ok: false,
      message: e instanceof Error ? e.message : "調整に失敗しました。",
    };
  }
}
