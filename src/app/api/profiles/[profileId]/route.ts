import { NextResponse } from "next/server";

import { getViewerEmailFromCookie } from "@/lib/auth/viewer";
import { prisma } from "@/lib/db";
import { profileByIdForViewer } from "@/lib/profile/activeProfile";

type Params = { params: Promise<{ profileId: string }> };

export async function PATCH(req: Request, { params }: Params) {
  const viewerEmail = await getViewerEmailFromCookie();
  if (!viewerEmail) {
    return NextResponse.json({ error: "ログインが必要です", code: "AUTH_REQUIRED" }, { status: 401 });
  }

  const { profileId } = await params;
  const existing = await profileByIdForViewer(profileId, viewerEmail);
  if (!existing) {
    return NextResponse.json(
      { error: "指定プロフィールへアクセスできません", code: "FORBIDDEN_PROFILE" },
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
