import { NextResponse } from "next/server";

import { getViewerEmailFromCookie } from "@/lib/auth/viewer";
import {
  deleteJournalDraft,
  getJournalDraft,
  upsertJournalDraft,
} from "@/lib/journal/journalDrafts";
import { profileByIdForViewer, resolveActiveProfileId } from "@/lib/profile/activeProfile";

export async function GET(req: Request) {
  const viewerEmail = await getViewerEmailFromCookie();
  if (!viewerEmail) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(req.url);
  const dateKey = (url.searchParams.get("dateKey") ?? "").trim();
  const rawProfileId = (url.searchParams.get("profileId") ?? "").trim();
  const activeProfileId = await resolveActiveProfileId(viewerEmail);
  const profileId = rawProfileId || activeProfileId;
  if (!profileId || !dateKey) {
    return NextResponse.json({ draft: null });
  }

  const p = await profileByIdForViewer(profileId, viewerEmail);
  if (!p) {
    return NextResponse.json({ error: "プロフィールが不正です。" }, { status: 403 });
  }

  const draft = await getJournalDraft({
    email: viewerEmail,
    profileId,
    dateKey,
  });
  return NextResponse.json({ draft });
}

export async function PUT(req: Request) {
  const viewerEmail = await getViewerEmailFromCookie();
  if (!viewerEmail) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ error: "JSONが不正です。" }, { status: 400 });
  }

  const body = typeof json === "object" && json !== null ? (json as Record<string, unknown>) : {};
  const dateKey = String(body.dateKey ?? "").trim();
  const content = String(body.content ?? "");
  const rawProfileId = String(body.profileId ?? "").trim();
  const activeProfileId = await resolveActiveProfileId(viewerEmail);
  const profileId = rawProfileId || activeProfileId;

  if (!profileId) {
    return NextResponse.json({ error: "プロフィールが必要です。" }, { status: 400 });
  }
  const p = await profileByIdForViewer(profileId, viewerEmail);
  if (!p) {
    return NextResponse.json({ error: "プロフィールが不正です。" }, { status: 403 });
  }

  try {
    const draft = await upsertJournalDraft({
      email: viewerEmail,
      profileId,
      dateKey,
      content,
      mood: String(body.mood ?? "calm"),
      activity: String(body.activity ?? "record_anyway"),
      companionType: String(body.companionType ?? "owl"),
      designTheme: String(body.designTheme ?? "simple"),
      contentFontMode: String(body.contentFontMode ?? "standard"),
      writingMode: String(body.writingMode ?? "alone"),
    });
    return NextResponse.json({ draft, code: "OK" });
  } catch (e) {
    const message = e instanceof Error ? e.message : "下書きの保存に失敗しました。";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function DELETE(req: Request) {
  const viewerEmail = await getViewerEmailFromCookie();
  if (!viewerEmail) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(req.url);
  const dateKey = (url.searchParams.get("dateKey") ?? "").trim();
  const rawProfileId = (url.searchParams.get("profileId") ?? "").trim();
  const activeProfileId = await resolveActiveProfileId(viewerEmail);
  const profileId = rawProfileId || activeProfileId;
  if (!profileId || !dateKey) {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  const deleted = await deleteJournalDraft({
    email: viewerEmail,
    profileId,
    dateKey,
  });
  return NextResponse.json({ ok: deleted });
}
