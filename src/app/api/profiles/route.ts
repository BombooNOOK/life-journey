import { NextResponse } from "next/server";

import { getViewerEmailFromCookie } from "@/lib/auth/viewer";
import { listProfilesAndActiveProfileId } from "@/lib/profile/activeProfile";
import {
  isViewerProfileCreateEnabled,
  PROFILE_CREATE_DISABLED_USER_MESSAGE,
} from "@/lib/profile/viewerProfileUiPolicy";

export async function GET() {
  const viewerEmail = await getViewerEmailFromCookie();
  if (!viewerEmail) {
    return NextResponse.json({ error: "ログインが必要です", code: "AUTH_REQUIRED" }, { status: 401 });
  }
  const { profiles, activeProfileId } = await listProfilesAndActiveProfileId(viewerEmail);
  return NextResponse.json({ profiles, activeProfileId, code: "OK" });
}

/** 本人中心化：一般・管理者とも新規 Profile 作成は停止（既定1件の ensure は別経路） */
export async function POST() {
  const viewerEmail = await getViewerEmailFromCookie();
  if (!viewerEmail) {
    return NextResponse.json({ error: "ログインが必要です", code: "AUTH_REQUIRED" }, { status: 401 });
  }
  if (!isViewerProfileCreateEnabled()) {
    return NextResponse.json(
      { error: PROFILE_CREATE_DISABLED_USER_MESSAGE, code: "PROFILE_CREATE_DISABLED" },
      { status: 403 },
    );
  }
  return NextResponse.json(
    { error: PROFILE_CREATE_DISABLED_USER_MESSAGE, code: "PROFILE_CREATE_DISABLED" },
    { status: 403 },
  );
}
