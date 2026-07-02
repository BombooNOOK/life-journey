import { NextResponse } from "next/server";

import { getViewerEmailFromCookie } from "@/lib/auth/viewer";
import { extractReadingFirstSentence } from "@/lib/journal/companionWriting/readingFirstSentence";
import { buildJournalGeneratedComment } from "@/lib/journal/kanteiCommentEligibility";
import { normalizeCompanionType } from "@/lib/journal/meta";

function parseEntryDateYmd(value: string): Date | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value.trim());
  if (!m) return null;
  const year = Number(m[1]);
  const month = Number(m[2]);
  const day = Number(m[3]);
  if (!Number.isFinite(year) || !Number.isFinite(month) || !Number.isFinite(day)) return null;
  return new Date(Date.UTC(year, month - 1, day, 12, 0, 0));
}

/** 伴走ウィザード専用：保存本文用の読み解き先頭1文プレビュー */
export async function GET(req: Request) {
  const viewerEmail = await getViewerEmailFromCookie();
  if (!viewerEmail) {
    return NextResponse.json({ error: "ログインが必要です" }, { status: 401 });
  }

  const url = new URL(req.url);
  const profileId = url.searchParams.get("profileId")?.trim() ?? "";
  const mood = url.searchParams.get("mood")?.trim() ?? "";
  const companionType = normalizeCompanionType(url.searchParams.get("companionType"));
  const entryDateYmd = url.searchParams.get("entryDate")?.trim() ?? "";
  const referenceDate = parseEntryDateYmd(entryDateYmd);

  if (!profileId || !mood || !referenceDate) {
    return NextResponse.json({ error: "パラメータが不正です" }, { status: 400 });
  }

  const generatedComment = await buildJournalGeneratedComment({
    viewerEmail,
    profileId,
    activity: "record_anyway",
    mood,
    companionType,
    referenceDate,
  });

  if (!generatedComment?.trim()) {
    return NextResponse.json({ readingFirstSentence: null });
  }

  const readingFirstSentence = extractReadingFirstSentence(generatedComment);
  return NextResponse.json({ readingFirstSentence: readingFirstSentence || null });
}
