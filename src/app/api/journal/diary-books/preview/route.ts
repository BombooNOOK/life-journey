import { NextResponse } from "next/server";

import { getViewerEmailFromCookie } from "@/lib/auth/viewer";
import { parseDiaryBookPreviewFields } from "@/lib/journal/diaryBookForm";
import {
  countJournalEntriesInDiaryBookPeriod,
  NO_ENTRIES_IN_DIARY_BOOK_PERIOD_MESSAGE,
} from "@/lib/journal/diaryBookPeriod";
import { resolveDiaryBookProfileId } from "@/lib/journal/diaryBookProfile";

const JSON_NO_STORE = {
  headers: {
    "Cache-Control": "private, no-store, max-age=0, must-revalidate",
  },
} as const;

export async function POST(req: Request) {
  const viewerEmail = await getViewerEmailFromCookie();
  if (!viewerEmail) {
    return NextResponse.json(
      { error: "ログイン情報を確認できませんでした。", code: "AUTH_REQUIRED" },
      { status: 401, ...JSON_NO_STORE },
    );
  }

  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json(
      { error: "JSONが不正です。", code: "BAD_JSON" },
      { status: 400, ...JSON_NO_STORE },
    );
  }

  const parsed = parseDiaryBookPreviewFields(json);
  if (!parsed.ok) {
    return NextResponse.json(
      { error: parsed.error, code: parsed.code },
      { status: parsed.status, ...JSON_NO_STORE },
    );
  }

  const rawProfileId =
    typeof json === "object" && json !== null && "profileId" in json
      ? String((json as { profileId: unknown }).profileId)
      : "";
  const profileResult = await resolveDiaryBookProfileId(viewerEmail, rawProfileId);
  if (!profileResult.ok) {
    return NextResponse.json(
      { error: profileResult.error, code: profileResult.code },
      { status: profileResult.status, ...JSON_NO_STORE },
    );
  }

  const entryCount = await countJournalEntriesInDiaryBookPeriod({
    email: viewerEmail,
    profileId: profileResult.profileId,
    startDate: parsed.data.startDate,
    endDate: parsed.data.endDate,
  });

  const canCreate = entryCount > 0;

  return NextResponse.json(
    {
      entryCount,
      canCreate,
      ...(canCreate ? {} : { message: NO_ENTRIES_IN_DIARY_BOOK_PERIOD_MESSAGE }),
      code: "OK",
    },
    JSON_NO_STORE,
  );
}
