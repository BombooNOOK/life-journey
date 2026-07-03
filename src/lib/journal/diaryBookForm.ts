import {
  isDiaryCoverStyleRawAllowed,
  normalizeDiaryCoverStyle,
} from "@/lib/journal/coverAssets";
import { parseDiaryBookDateRange } from "@/lib/journal/diaryBookPeriod";

export type DiaryBookCreateFields = {
  title: string;
  startDate: string;
  endDate: string;
  coverTheme: string;
};

export type DiaryBookFormParseResult =
  | { ok: true; data: DiaryBookCreateFields }
  | { ok: false; status: number; code: string; error: string };

export function parseDiaryBookCreateFields(json: unknown): DiaryBookFormParseResult {
  if (typeof json !== "object" || json === null) {
    return { ok: false, status: 400, code: "BAD_JSON", error: "JSONが不正です。" };
  }

  const rawTitle = "title" in json ? String((json as { title: unknown }).title) : "";
  const rawStart =
    "startDate" in json ? String((json as { startDate: unknown }).startDate) : "";
  const rawEnd = "endDate" in json ? String((json as { endDate: unknown }).endDate) : "";
  const rawCover =
    "coverTheme" in json ? String((json as { coverTheme: unknown }).coverTheme) : "";

  const title = rawTitle.trim();
  if (!title) {
    return { ok: false, status: 400, code: "BAD_TITLE", error: "日記ブック名を入力してください。" };
  }
  if (title.length > 80) {
    return {
      ok: false,
      status: 400,
      code: "BAD_TITLE",
      error: "日記ブック名は80文字以内にしてください。",
    };
  }

  const dateRange = parseDiaryBookDateRange(rawStart, rawEnd);
  if (!dateRange) {
    return {
      ok: false,
      status: 400,
      code: "BAD_DATE_RANGE",
      error: "開始日・終了日の形式が不正です。",
    };
  }

  if (!isDiaryCoverStyleRawAllowed(rawCover)) {
    return { ok: false, status: 400, code: "BAD_COVER", error: "表紙デザインの値が不正です。" };
  }

  return {
    ok: true,
    data: {
      title,
      startDate: dateRange.startDate,
      endDate: dateRange.endDate,
      coverTheme: normalizeDiaryCoverStyle(rawCover.trim() || "casual"),
    },
  };
}

export function parseDiaryBookPreviewFields(json: unknown): DiaryBookFormParseResult {
  if (typeof json !== "object" || json === null) {
    return { ok: false, status: 400, code: "BAD_JSON", error: "JSONが不正です。" };
  }

  const rawStart =
    "startDate" in json ? String((json as { startDate: unknown }).startDate) : "";
  const rawEnd = "endDate" in json ? String((json as { endDate: unknown }).endDate) : "";
  const rawCover =
    "coverTheme" in json ? String((json as { coverTheme: unknown }).coverTheme) : "casual";

  const dateRange = parseDiaryBookDateRange(rawStart, rawEnd);
  if (!dateRange) {
    return {
      ok: false,
      status: 400,
      code: "BAD_DATE_RANGE",
      error: "開始日・終了日の形式が不正です。",
    };
  }

  if (rawCover.trim() && !isDiaryCoverStyleRawAllowed(rawCover)) {
    return { ok: false, status: 400, code: "BAD_COVER", error: "表紙デザインの値が不正です。" };
  }

  const rawTitle = "title" in json ? String((json as { title: unknown }).title).trim() : "";

  return {
    ok: true,
    data: {
      title: rawTitle,
      startDate: dateRange.startDate,
      endDate: dateRange.endDate,
      coverTheme: normalizeDiaryCoverStyle(rawCover.trim() || "casual"),
    },
  };
}

export type DiaryBookPeriodFields = {
  startDate: string;
  endDate: string;
};

export type DiaryBookPeriodParseResult =
  | { ok: true; data: DiaryBookPeriodFields }
  | { ok: false; status: number; code: string; error: string };

export function parseDiaryBookPeriodFields(json: unknown): DiaryBookPeriodParseResult {
  if (typeof json !== "object" || json === null) {
    return { ok: false, status: 400, code: "BAD_JSON", error: "JSONが不正です。" };
  }

  const rawStart =
    "startDate" in json ? String((json as { startDate: unknown }).startDate) : "";
  const rawEnd = "endDate" in json ? String((json as { endDate: unknown }).endDate) : "";

  const dateRange = parseDiaryBookDateRange(rawStart, rawEnd);
  if (!dateRange) {
    return {
      ok: false,
      status: 400,
      code: "BAD_DATE_RANGE",
      error: "開始日・終了日の形式が不正です。",
    };
  }

  return {
    ok: true,
    data: {
      startDate: dateRange.startDate,
      endDate: dateRange.endDate,
    },
  };
}
