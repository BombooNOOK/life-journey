import { NextResponse } from "next/server";

import { getViewerEmailFromCookie } from "@/lib/auth/viewer";
import {
  ensureGardenPlantForProfile,
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

    const plant = await ensureGardenPlantForProfile({
      email,
      profileId: activeProfileId,
    });
    return NextResponse.json({ plant });
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
        { error: result.error, plant: result.plant ?? null },
        { status: 409 },
      );
    }
    return NextResponse.json({ plant: result.plant });
  } catch (e) {
    console.error("[POST /api/garden/plant]", e);
    return NextResponse.json({ error: "お水をあげられませんでした。" }, { status: 500 });
  }
}
