import { NextResponse } from "next/server";

import { getViewerEmailFromCookie } from "@/lib/auth/viewer";
import { profileByIdForViewer, PROFILE_COOKIE_KEY } from "@/lib/profile/activeProfile";

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
  const profileId =
    typeof json === "object" && json !== null && "profileId" in json
      ? String((json as { profileId: unknown }).profileId).trim()
      : "";
  if (!profileId) {
    return NextResponse.json({ error: "profileId が必要です", code: "NO_PROFILE_ID" }, { status: 400 });
  }
  const profile = await profileByIdForViewer(profileId, viewerEmail);
  if (!profile) {
    return NextResponse.json({ error: "指定プロフィールへアクセスできません", code: "FORBIDDEN_PROFILE" }, { status: 403 });
  }
  const res = NextResponse.json({ code: "OK" });
  res.cookies.set(PROFILE_COOKIE_KEY, profile.id, {
    path: "/",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 365,
  });
  return res;
}
