import { NextResponse } from "next/server";

import { getViewerEmailFromCookie } from "@/lib/auth/viewer";
import { getDonguriChoView, sumDonguriBalance } from "@/lib/loghouse/donguriLedger";
import { DONGURI_DIARY_SAVE_COST } from "@/lib/loghouse/donguriTypes";
import { profileByIdForViewer, resolveActiveProfileId } from "@/lib/profile/activeProfile";

export async function GET(req: Request) {
  const viewerEmail = await getViewerEmailFromCookie();
  if (!viewerEmail) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(req.url);
  const rawProfileId = (url.searchParams.get("profileId") ?? "").trim();
  const includeCho = (url.searchParams.get("view") ?? "").trim() === "cho";
  const activeProfileId = await resolveActiveProfileId(viewerEmail);
  const profileId = rawProfileId || activeProfileId;
  if (!profileId) {
    return NextResponse.json({ balance: 0, diarySaveCost: DONGURI_DIARY_SAVE_COST });
  }

  const p = await profileByIdForViewer(profileId, viewerEmail);
  if (!p) {
    return NextResponse.json({ error: "プロフィールが不正です。" }, { status: 403 });
  }

  if (includeCho) {
    const cho = await getDonguriChoView({ email: viewerEmail, profileId });
    return NextResponse.json({
      balance: cho.balance,
      diarySaveCost: DONGURI_DIARY_SAVE_COST,
      profileId,
      cho,
    });
  }

  const balance = await sumDonguriBalance({ email: viewerEmail, profileId });
  return NextResponse.json({
    balance,
    diarySaveCost: DONGURI_DIARY_SAVE_COST,
    profileId,
  });
}
