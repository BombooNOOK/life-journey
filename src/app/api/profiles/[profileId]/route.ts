import { NextResponse } from "next/server";

import { isAdminEmail } from "@/lib/admin/access";
import { getViewerEmailFromCookie } from "@/lib/auth/viewer";
import { prisma } from "@/lib/db";
import { assertFullAccessForApi } from "@/lib/entitlement/requireFullAccess";
import { profileByIdForViewer } from "@/lib/profile/activeProfile";
import { parseProfileIdFromRouteParam } from "@/lib/profile/parseProfileIdFromRouteParam";

type Params = { params: Promise<{ profileId: string }> };

export async function PATCH(req: Request, { params }: Params) {
  const viewerEmail = await getViewerEmailFromCookie();
  if (!viewerEmail) {
    return NextResponse.json({ error: "ログインが必要です", code: "AUTH_REQUIRED" }, { status: 401 });
  }

  const denied = await assertFullAccessForApi(viewerEmail);
  if (denied) return denied;

  // 一般ユーザー向けの内部ニックネーム変更は停止。admin の既存枠識別用のみ許可。
  if (!(await isAdminEmail(viewerEmail))) {
    return NextResponse.json(
      {
        error: "表示名の変更は、森の住民票のおなまえから行えます。",
        code: "PROFILE_NICKNAME_EDIT_DISABLED",
      },
      { status: 403 },
    );
  }

  const { profileId: profileIdRaw } = await params;
  const profileId = parseProfileIdFromRouteParam(profileIdRaw);
  const existing = await profileByIdForViewer(profileId, viewerEmail);
  if (!existing) {
    return NextResponse.json(
      { error: "指定の記録枠へアクセスできません", code: "FORBIDDEN_PROFILE" },
      { status: 403 },
    );
  }

  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ error: "JSONが不正です", code: "BAD_JSON" }, { status: 400 });
  }

  const nickname =
    typeof json === "object" && json !== null && "nickname" in json
      ? String((json as { nickname: unknown }).nickname).trim()
      : "";
  if (!nickname) {
    return NextResponse.json({ error: "プロフィール名を入力してください", code: "EMPTY_NICKNAME" }, { status: 400 });
  }
  if (nickname.length > 40) {
    return NextResponse.json(
      { error: "プロフィール名は40文字以内で入力してください", code: "NICKNAME_TOO_LONG" },
      { status: 400 },
    );
  }

  const profile = await prisma.profile.update({
    where: { id: profileId },
    data: { nickname },
    select: { id: true, nickname: true },
  });

  return NextResponse.json({ profile, code: "OK" });
}
