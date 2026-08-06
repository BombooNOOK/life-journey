import { NextResponse } from "next/server";

import { getViewerEmailFromCookie } from "@/lib/auth/viewer";
import { getMoriLogDeviceMovieDonguriStatus } from "@/lib/loghouse/donguriMoriLogDeviceMovie";
import { profileByIdForViewer, resolveActiveProfileId } from "@/lib/profile/activeProfile";

/** 最終確認UI用の事前ステータス（確定API側でも再判定する） */
export async function GET(req: Request) {
  const viewerEmail = await getViewerEmailFromCookie();
  if (!viewerEmail) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(req.url);
  const rawProfileId = (url.searchParams.get("profileId") ?? "").trim();
  const activeProfileId = await resolveActiveProfileId(viewerEmail);
  const profileId = rawProfileId || activeProfileId;
  if (!profileId) {
    return NextResponse.json({
      firstFreeAvailable: true,
      balance: 0,
      paidCost: 2,
    });
  }

  const profile = await profileByIdForViewer(profileId, viewerEmail);
  if (!profile) {
    return NextResponse.json({ error: "プロフィールが不正です。" }, { status: 403 });
  }

  const status = await getMoriLogDeviceMovieDonguriStatus({
    email: viewerEmail,
    profileId,
  });
  return NextResponse.json(status);
}
