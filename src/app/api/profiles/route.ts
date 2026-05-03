import { NextResponse } from "next/server";

import { getViewerEmailFromCookie, normalizeEmail } from "@/lib/auth/viewer";
import { prisma } from "@/lib/db";
import { listProfilesAndActiveProfileId } from "@/lib/profile/activeProfile";

export async function GET() {
  const viewerEmail = await getViewerEmailFromCookie();
  if (!viewerEmail) {
    return NextResponse.json({ error: "ログインが必要です", code: "AUTH_REQUIRED" }, { status: 401 });
  }
  const { profiles, activeProfileId } = await listProfilesAndActiveProfileId(viewerEmail);
  return NextResponse.json({ profiles, activeProfileId, code: "OK" });
}

export async function POST(req: Request) {
  const viewerEmail = await getViewerEmailFromCookie();
  if (!viewerEmail) {
    return NextResponse.json({ error: "ログインが必要です", code: "AUTH_REQUIRED" }, { status: 401 });
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
    return NextResponse.json({ error: "ニックネームを入力してください", code: "EMPTY_NICKNAME" }, { status: 400 });
  }
  if (nickname.length > 40) {
    return NextResponse.json(
      { error: "ニックネームは40文字以内で入力してください", code: "NICKNAME_TOO_LONG" },
      { status: 400 },
    );
  }
  const email = normalizeEmail(viewerEmail);
  const settings = await prisma.accountSettings.findUnique({
    where: { email },
    select: { profileLimit: true },
  });
  const limit = settings?.profileLimit ?? 1;
  const currentCount = await prisma.profile.count({ where: { email, isArchived: false } });
  if (currentCount >= limit) {
    return NextResponse.json(
      { error: `現在のプラン上限（${limit}プロフィール）に達しています`, code: "PROFILE_LIMIT" },
      { status: 400 },
    );
  }
  const profile = await prisma.profile.create({
    data: { email, nickname },
    select: { id: true, nickname: true },
  });
  return NextResponse.json({ profile, code: "OK" });
}
