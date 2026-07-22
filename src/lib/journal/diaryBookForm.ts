import {
  isDiaryCoverStyleRawAllowed,
  normalizeDiaryCoverStyle,
} from "@/lib/journal/coverAssets";
import {
  isAshiatoPageTemplateRawAllowed,
  normalizeAshiatoPageTemplateId,
} from "@/lib/journal/ashiatoPageTemplates";
import { parseDiaryBookDateRange } from "@/lib/journal/diaryBookPeriod";
import {
  parseDiaryBookTagFilterFromRequest,
  type DiaryBookTagScope,
} from "@/lib/journal/diaryBookTagFilter";

export type DiaryBookCreateFields = {
  title: string;
  startDate: string;
  endDate: string;
  coverTheme: string;
  pageTemplate: string;
  tagFilter: string;
  tagFilterMode: DiaryBookTagScope["tagFilterMode"];
};

export type DiaryBookFormParseResult =
  | { ok: true; data: DiaryBookCreateFields }
  | { ok: false; status: number; code: string; error: string };

function parseCoverAndPageTemplate(json: object):
  | { ok: true; coverTheme: string; pageTemplate: string }
  | { ok: false; status: number; code: string; error: string } {
  const rawCover =
    "coverTheme" in json ? String((json as { coverTheme: unknown }).coverTheme) : "";
  const rawPage =
    "pageTemplate" in json ? String((json as { pageTemplate: unknown }).pageTemplate) : "";

  if (rawCover.trim() && !isDiaryCoverStyleRawAllowed(rawCover)) {
    return { ok: false, status: 400, code: "BAD_COVER", error: "表紙デザインの値が不正です。" };
  }
  if (rawPage.trim() && !isAshiatoPageTemplateRawAllowed(rawPage)) {
    return {
      ok: false,
      status: 400,
      code: "BAD_PAGE_TEMPLATE",
      error: "ページのかたちの値が不正です。",
    };
  }

  return {
    ok: true,
    coverTheme: normalizeDiaryCoverStyle(rawCover.trim() || "cover_mori_standard"),
    pageTemplate: normalizeAshiatoPageTemplateId(rawPage.trim() || undefined),
  };
}

export function parseDiaryBookCreateFields(json: unknown): DiaryBookFormParseResult {
  if (typeof json !== "object" || json === null) {
    return { ok: false, status: 400, code: "BAD_JSON", error: "JSONが不正です。" };
  }

  const rawTitle = "title" in json ? String((json as { title: unknown }).title) : "";
  const rawStart =
    "startDate" in json ? String((json as { startDate: unknown }).startDate) : "";
  const rawEnd = "endDate" in json ? String((json as { endDate: unknown }).endDate) : "";

  const title = rawTitle.trim();
  if (!title) {
    return { ok: false, status: 400, code: "BAD_TITLE", error: "あしあとブック名を入力してください。" };
  }
  if (title.length > 80) {
    return {
      ok: false,
      status: 400,
      code: "BAD_TITLE",
      error: "あしあとブック名は80文字以内にしてください。",
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

  const coverPage = parseCoverAndPageTemplate(json);
  if (!coverPage.ok) return coverPage;

  const tagScope = parseDiaryBookTagFilterFromRequest(json);

  return {
    ok: true,
    data: {
      title,
      startDate: dateRange.startDate,
      endDate: dateRange.endDate,
      coverTheme: coverPage.coverTheme,
      pageTemplate: coverPage.pageTemplate,
      tagFilter: tagScope.tagFilter,
      tagFilterMode: tagScope.tagFilterMode,
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

  const dateRange = parseDiaryBookDateRange(rawStart, rawEnd);
  if (!dateRange) {
    return {
      ok: false,
      status: 400,
      code: "BAD_DATE_RANGE",
      error: "開始日・終了日の形式が不正です。",
    };
  }

  const coverPage = parseCoverAndPageTemplate(json);
  if (!coverPage.ok) return coverPage;

  const rawTitle = "title" in json ? String((json as { title: unknown }).title).trim() : "";
  const tagScope = parseDiaryBookTagFilterFromRequest(json);

  return {
    ok: true,
    data: {
      title: rawTitle,
      startDate: dateRange.startDate,
      endDate: dateRange.endDate,
      coverTheme: coverPage.coverTheme,
      pageTemplate: coverPage.pageTemplate,
      tagFilter: tagScope.tagFilter,
      tagFilterMode: tagScope.tagFilterMode,
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
