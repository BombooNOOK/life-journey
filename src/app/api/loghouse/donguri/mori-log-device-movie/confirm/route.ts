import { NextResponse } from "next/server";

import { getViewerEmailFromCookie } from "@/lib/auth/viewer";
import { confirmMoriLogDeviceMovieAcorns } from "@/lib/loghouse/donguriMoriLogDeviceMovie";
import { DONGURI_MORI_LOG_DEVICE_MOVIE_COST } from "@/lib/loghouse/donguriTypes";
import { profileByIdForViewer } from "@/lib/profile/activeProfile";

type Body = {
  profileId?: unknown;
  mediaId?: unknown;
};

export async function POST(req: Request) {
  const viewerEmail = await getViewerEmailFromCookie();
  if (!viewerEmail) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: Body;
  try {
    body = (await req.json()) as Body;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const profileId = typeof body.profileId === "string" ? body.profileId.trim() : "";
  const mediaId = typeof body.mediaId === "string" ? body.mediaId.trim() : "";
  if (!profileId || !mediaId) {
    return NextResponse.json(
      { error: "profileId と mediaId が必要です。" },
      { status: 400 },
    );
  }

  const profile = await profileByIdForViewer(profileId, viewerEmail);
  if (!profile) {
    return NextResponse.json({ error: "プロフィールが不正です。" }, { status: 403 });
  }

  try {
    const result = await confirmMoriLogDeviceMovieAcorns({
      email: viewerEmail,
      profileId,
      mediaId,
    });

    if (!result.ok) {
      return NextResponse.json(
        {
          error: "どんぐりが足りません。",
          code: "ACORN_INSUFFICIENT",
          balance: result.balance,
          required: result.required ?? DONGURI_MORI_LOG_DEVICE_MOVIE_COST,
          mediaId,
        },
        { status: 402 },
      );
    }

    return NextResponse.json({
      ok: true,
      mediaId: result.mediaId,
      chargeType: result.chargeType,
      amount: result.amount,
      balance: result.balance,
      alreadyProcessed: result.alreadyProcessed,
    });
  } catch (e) {
    console.error("[mori-log-device-movie confirm failed]", {
      email: viewerEmail,
      profileId,
      mediaId,
      error: e instanceof Error ? e.message : e,
    });
    return NextResponse.json(
      { error: "確定処理に失敗しました。", code: "CONFIRM_FAILED" },
      { status: 500 },
    );
  }
}
