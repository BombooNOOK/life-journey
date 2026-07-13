import { NextResponse } from "next/server";

import { getViewerEmailFromCookie } from "@/lib/auth/viewer";
import {
  applyGardenBloomChoice,
  type GardenBloomChoice,
} from "@/lib/garden/gardenPlant";
import { listProfilesAndActiveProfileId } from "@/lib/profile/activeProfile";

function parseChoice(raw: unknown): GardenBloomChoice | null {
  if (raw === "keep" || raw === "display" || raw === "share") return raw;
  return null;
}

export async function POST(req: Request) {
  const email = await getViewerEmailFromCookie();
  if (!email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { activeProfileId, profiles } = await listProfilesAndActiveProfileId(email);
    if (!activeProfileId || profiles.length === 0) {
      return NextResponse.json({ error: "プロフィールがありません。" }, { status: 400 });
    }

    const body = (await req.json()) as { choice?: unknown; slotIndex?: unknown };
    const choice = parseChoice(body.choice);
    if (!choice) {
      return NextResponse.json({ error: "選択肢を確認できませんでした。" }, { status: 400 });
    }

    const slotIndex =
      typeof body.slotIndex === "number" && Number.isInteger(body.slotIndex)
        ? body.slotIndex
        : undefined;

    const result = await applyGardenBloomChoice({
      email,
      profileId: activeProfileId,
      choice,
      slotIndex,
    });

    if (!result.ok) {
      return NextResponse.json(
        { error: result.error, ...(result.state ?? {}) },
        { status: 409 },
      );
    }

    return NextResponse.json({
      message: result.message,
      ...result.state,
    });
  } catch (e) {
    console.error("[POST /api/garden/bloom-choice]", e);
    return NextResponse.json({ error: "選択を保存できませんでした。" }, { status: 500 });
  }
}
