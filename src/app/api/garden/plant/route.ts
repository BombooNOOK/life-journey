import { NextResponse } from "next/server";

import { getViewerEmailFromCookie } from "@/lib/auth/viewer";
import {
  loadGardenStateForProfile,
  waterGardenPlantForProfile,
} from "@/lib/garden/gardenPlant";
import { listProfilesAndActiveProfileId } from "@/lib/profile/activeProfile";

export async function GET() {
  const email = await getViewerEmailFromCookie();
  if (!email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { activeProfileId, profiles } = await listProfilesAndActiveProfileId(email);
    if (!activeProfileId || profiles.length === 0) {
      return NextResponse.json({ error: "プロフィールがありません。" }, { status: 400 });
    }

    const state = await loadGardenStateForProfile({
      email,
      profileId: activeProfileId,
    });
    return NextResponse.json(state);
  } catch (e) {
    console.error("[GET /api/garden/plant]", e);
    return NextResponse.json({ error: "お庭を読み込めませんでした。" }, { status: 500 });
  }
}

export async function POST() {
  const email = await getViewerEmailFromCookie();
  if (!email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { activeProfileId, profiles } = await listProfilesAndActiveProfileId(email);
    if (!activeProfileId || profiles.length === 0) {
      return NextResponse.json({ error: "プロフィールがありません。" }, { status: 400 });
    }

    const result = await waterGardenPlantForProfile({
      email,
      profileId: activeProfileId,
    });
    if (!result.ok) {
      return NextResponse.json(
        { error: result.error, ...(result.state ?? {}) },
        { status: 409 },
      );
    }
    return NextResponse.json(result.state);
  } catch (e) {
    console.error("[POST /api/garden/plant]", e);
    return NextResponse.json({ error: "お水をあげられませんでした。" }, { status: 500 });
  }
}
