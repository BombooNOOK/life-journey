import { NextResponse } from "next/server";

import { getViewerEmailFromCookie, normalizeEmail } from "@/lib/auth/viewer";
import { prisma } from "@/lib/db";
import { journalDraftPhotoApiPath } from "@/lib/journal/journalDrafts";
import { loadJournalEntryPhotoPayload } from "@/lib/journal/journalEntryPhotoResolve";
import { profileByIdForViewer, resolveActiveProfileId } from "@/lib/profile/activeProfile";

const JSON_NO_STORE = {
  headers: {
    "Cache-Control": "private, no-store, max-age=0, must-revalidate",
  },
} as const;

export async function GET(req: Request) {
  const viewerEmail = await getViewerEmailFromCookie();
  if (!viewerEmail) {
    return NextResponse.json(
      { error: "ログイン情報を確認できませんでした。", code: "AUTH_REQUIRED" },
      { status: 401, ...JSON_NO_STORE },
    );
  }

  const url = new URL(req.url);
  const dateKey = (url.searchParams.get("dateKey") ?? "").trim();
  const rawProfileId = (url.searchParams.get("profileId") ?? "").trim();
  const activeProfileId = await resolveActiveProfileId(viewerEmail);
  const profileId = rawProfileId || activeProfileId;

  if (!profileId || !/^\d{4}-\d{2}-\d{2}$/.test(dateKey)) {
    return NextResponse.json(
      { error: "日付またはプロフィールが不正です。", code: "BAD_REQUEST" },
      { status: 400, ...JSON_NO_STORE },
    );
  }

  const p = await profileByIdForViewer(profileId, viewerEmail);
  if (!p) {
    return NextResponse.json(
      { error: "プロフィールが不正です。", code: "FORBIDDEN" },
      { status: 403, ...JSON_NO_STORE },
    );
  }

  const email = normalizeEmail(viewerEmail);
  const row = await prisma.journalDraft.findUnique({
    where: {
      email_profileId_dateKey: { email, profileId, dateKey },
    },
    select: {
      id: true,
      photoDataUrl: true,
      photoBlobUrl: true,
      photoBlobPathname: true,
      photoMimeType: true,
      photoSizeBytes: true,
    },
  });
  if (!row) {
    return NextResponse.json(
      { error: "下書きが見つかりません。", code: "NOT_FOUND" },
      { status: 404, ...JSON_NO_STORE },
    );
  }

  const payload = await loadJournalEntryPhotoPayload({
    id: row.id,
    photoDataUrl: row.photoDataUrl,
    photoBlobUrl: row.photoBlobUrl,
    photoBlobPathname: row.photoBlobPathname,
    photoMimeType: row.photoMimeType,
    photoSizeBytes: row.photoSizeBytes,
    photoStorageProvider: null,
  });
  if (!payload) {
    return NextResponse.json(
      { error: "この下書きに写真はありません。", code: "NO_PHOTO" },
      { status: 404, ...JSON_NO_STORE },
    );
  }

  if (url.searchParams.get("format") === "json") {
    if (payload.kind === "legacy_json") {
      return NextResponse.json(
        { photoDataUrl: payload.photoDataUrl, code: "OK" },
        JSON_NO_STORE,
      );
    }
    return NextResponse.json(
      {
        photoDataUrl: null,
        photoSrc: journalDraftPhotoApiPath(dateKey, profileId),
        code: "OK",
      },
      JSON_NO_STORE,
    );
  }

  if (payload.kind === "legacy_json") {
    return NextResponse.json(
      { photoDataUrl: payload.photoDataUrl, code: "OK" },
      JSON_NO_STORE,
    );
  }

  return new Response(new Uint8Array(payload.buffer), {
    status: 200,
    headers: {
      "Content-Type": payload.mimeType,
      "Cache-Control": "private, no-store, max-age=0, must-revalidate",
    },
  });
}
