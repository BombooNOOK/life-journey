import { NextResponse } from "next/server";

import { ensureForestResidentForEmail } from "@/lib/forestResident/forestResidentNumber";
import { getViewerEmailFromCookie } from "@/lib/auth/viewer";
import { listProfilesAndActiveProfileId } from "@/lib/profile/activeProfile";

export async function GET() {
  const email = await getViewerEmailFromCookie();
  if (!email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    await listProfilesAndActiveProfileId(email);
    const card = await ensureForestResidentForEmail(email);
    return NextResponse.json({ card });
  } catch (e) {
    console.error("[GET /api/viewer/forest-resident-card]", e);
    return NextResponse.json({ error: "Failed to load resident card" }, { status: 500 });
  }
}

export async function POST() {
  const email = await getViewerEmailFromCookie();
  if (!email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    await listProfilesAndActiveProfileId(email);
    const card = await ensureForestResidentForEmail(email);
    return NextResponse.json({ card });
  } catch (e) {
    console.error("[POST /api/viewer/forest-resident-card]", e);
    return NextResponse.json({ error: "Failed to provision resident card" }, { status: 500 });
  }
}
