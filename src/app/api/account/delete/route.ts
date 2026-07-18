import { NextResponse } from "next/server";

import { deleteUserAccount } from "@/lib/account/deleteUserAccount";
import { getViewerEmailFromCookie } from "@/lib/auth/viewer";

const cookieBase = {
  path: "/" as const,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
};

export async function POST(req: Request) {
  const viewerEmail = await getViewerEmailFromCookie();
  if (!viewerEmail) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "JSONが不正です。", code: "BAD_JSON" }, { status: 400 });
  }

  const confirmationWord =
    typeof body === "object" && body !== null && "confirmationWord" in body
      ? (body as { confirmationWord: unknown }).confirmationWord
      : undefined;

  try {
    await deleteUserAccount({ emailInput: viewerEmail, confirmationWord });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "住民登録の解除に失敗しました。";
    const code =
      typeof error === "object" && error !== null && "code" in error
        ? String((error as { code: unknown }).code)
        : "DELETE_FAILED";
    const status =
      code === "CONFIRMATION_WORD_MISMATCH"
        ? 400
        : code === "FIREBASE_AUTH_DELETE_FAILED" || code === "DB_DELETE_FAILED"
          ? 500
          : 409;
    return NextResponse.json({ error: message, code }, { status });
  }

  const res = NextResponse.json({ code: "OK" });
  res.cookies.set("lj_logged_in", "", { ...cookieBase, maxAge: 0 });
  res.cookies.set("lj_user_email", "", { ...cookieBase, maxAge: 0 });
  // 初回導線 Cookie もサーバー側で消す（端末に残ると再登録後の演出がおかしくなる）
  res.cookies.set("lj_first_visit_from_register", "", { ...cookieBase, maxAge: 0 });
  res.cookies.set("lj_onboarding_ch1", "", { ...cookieBase, maxAge: 0 });
  res.cookies.set("lj_onboarding_ch2", "", { ...cookieBase, maxAge: 0 });
  res.cookies.set("lj_onboarding_ch3_started", "", { ...cookieBase, maxAge: 0 });
  return res;
}

export async function GET() {
  const viewerEmail = await getViewerEmailFromCookie();
  if (!viewerEmail) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { buildAccountDeletePreview } = await import("@/lib/account/deleteUserAccount");
  try {
    const preview = await buildAccountDeletePreview(viewerEmail);
    return NextResponse.json(preview);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "削除可否の確認に失敗しました。";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
