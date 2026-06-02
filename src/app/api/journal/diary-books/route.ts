import { NextResponse } from "next/server";

import { getViewerEmailFromCookie } from "@/lib/auth/viewer";
import { prisma } from "@/lib/db";
import { parseDiaryBookCreateFields } from "@/lib/journal/diaryBookForm";
import {
  countJournalEntriesInDiaryBookPeriod,
  NO_ENTRIES_IN_DIARY_BOOK_PERIOD_MESSAGE,
} from "@/lib/journal/diaryBookPeriod";
import { resolveDiaryBookProfileId } from "@/lib/journal/diaryBookProfile";
import { listDiaryBooksForViewer } from "@/lib/journal/listDiaryBooks";

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
  const profileResult = await resolveDiaryBookProfileId(
    viewerEmail,
    url.searchParams.get("profileId"),
  );
  if (!profileResult.ok) {
    return NextResponse.json(
      { error: profileResult.error, code: profileResult.code },
      { status: profileResult.status, ...JSON_NO_STORE },
    );
  }

  const books = await listDiaryBooksForViewer({
    email: viewerEmail,
    profileId: profileResult.profileId,
  });

  return NextResponse.json({ books, code: "OK" }, JSON_NO_STORE);
}

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

  const parsed = parseDiaryBookCreateFields(json);
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

  if (entryCount < 1) {
    return NextResponse.json(
      {
        error: NO_ENTRIES_IN_DIARY_BOOK_PERIOD_MESSAGE,
        code: "NO_ENTRIES_IN_PERIOD",
      },
      { status: 422, ...JSON_NO_STORE },
    );
  }

  const row = await prisma.diaryBook.create({
    data: {
      email: viewerEmail,
      profileId: profileResult.profileId,
      title: parsed.data.title,
      startDate: parsed.data.startDate,
      endDate: parsed.data.endDate,
      coverTheme: parsed.data.coverTheme,
    },
  });

  return NextResponse.json(
    {
      book: {
        id: row.id,
        title: row.title,
        startDate: row.startDate,
        endDate: row.endDate,
        coverTheme: row.coverTheme,
        entryCount,
        createdAt: row.createdAt.toISOString(),
      },
      code: "OK",
    },
    { status: 201, ...JSON_NO_STORE },
  );
}
