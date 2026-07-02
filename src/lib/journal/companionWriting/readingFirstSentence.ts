import { buildDiaryReadingFromJournalInput } from "@/lib/diary-reading/fromJournal";
import { extractSocialPostCommentText } from "@/lib/journal/social-post-image/textExtract";
import type { CompanionType, MoodId } from "@/lib/journal/meta";

/** 読み解き全文から、保存本文用の最初の1文を取り出す */
export function extractReadingFirstSentence(readingText: string): string {
  return extractSocialPostCommentText(readingText).trim();
}

type BuildReadingPreviewParams = {
  mood: MoodId;
  companionType: CompanionType;
  entryDateYmd: string;
  birthMonth: number;
  birthDay: number;
};

/** 鑑定済み：今日の数字からの読み解き（先頭1文）をクライアントで組み立てる */
export function buildCompanionWritingReadingFirstSentence(
  params: BuildReadingPreviewParams,
): string | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(params.entryDateYmd.trim());
  if (!m) return null;
  const year = Number(m[1]);
  const month = Number(m[2]);
  const day = Number(m[3]);
  if (!Number.isFinite(year) || !Number.isFinite(month) || !Number.isFinite(day)) return null;

  const referenceDate = new Date(Date.UTC(year, month - 1, day, 12, 0, 0));
  const { text } = buildDiaryReadingFromJournalInput({
    activity: "record_anyway",
    mood: params.mood,
    companionType: params.companionType,
    referenceDate,
    birthMonth: params.birthMonth,
    birthDay: params.birthDay,
  });
  const first = extractReadingFirstSentence(text);
  return first || null;
}

type FetchReadingPreviewParams = {
  profileId: string;
  mood: MoodId;
  companionType: CompanionType;
  entryDateYmd: string;
};

/** 伴走保存直前：サーバー側と同じ読み解き生成から先頭1文を取得 */
export async function fetchCompanionWritingReadingFirstSentence(
  params: FetchReadingPreviewParams,
): Promise<string | null> {
  const qs = new URLSearchParams({
    profileId: params.profileId,
    mood: params.mood,
    companionType: params.companionType,
    entryDate: params.entryDateYmd,
  });
  const res = await fetch(`/api/journal/companion-reading-preview?${qs.toString()}`, {
    cache: "no-store",
    credentials: "same-origin",
  });
  if (!res.ok) return null;
  const data = (await res.json()) as { readingFirstSentence?: string | null };
  const first = String(data.readingFirstSentence ?? "").trim();
  return first || null;
}
