import { NextResponse } from "next/server";

import {
  ensureForestResidentForEmail,
  updateForestResidentDisplayName,
} from "@/lib/forestResident/forestResidentNumber";
import { getViewerEmailFromCookie } from "@/lib/auth/viewer";
import { listProfilesAndActiveProfileId } from "@/lib/profile/activeProfile";

async function loadResidentCardForViewer(email: string) {
  await listProfilesAndActiveProfileId(email);
  return ensureForestResidentForEmail(email);
}

export async function GET() {
  const email = await getViewerEmailFromCookie();
  if (!email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const card = await loadResidentCardForViewer(email);
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
    const card = await loadResidentCardForViewer(email);
    return NextResponse.json({ card });
  } catch (e) {
    console.error("[POST /api/viewer/forest-resident-card]", e);
    return NextResponse.json({ error: "Failed to provision resident card" }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  const email = await getViewerEmailFromCookie();
  if (!email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const json = (await req.json()) as { displayName?: unknown };
    const result = await updateForestResidentDisplayName(email, json.displayName);
    if ("error" in result) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }
    return NextResponse.json({ card: result });
  } catch (e) {
    console.error("[PATCH /api/viewer/forest-resident-card]", e);
    return NextResponse.json({ error: "Failed to update display name" }, { status: 500 });
  }
}
