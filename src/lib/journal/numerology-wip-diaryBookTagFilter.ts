import {
  formatDiaryTagsLine,
  parseDiaryTagInput,
  type DiaryBookTagFilterMode,
} from "@/lib/journal/diaryTags";

export type { DiaryBookTagFilterMode };

export type DiaryBookTagScope = {
  tagFilter: string;
  tagFilterMode: DiaryBookTagFilterMode;
};

export const DIARY_BOOK_TAG_FILTER_MODES = ["AND", "OR"] as const;

export function normalizeDiaryBookTagFilterMode(raw: string): DiaryBookTagFilterMode | null {
  const trimmed = raw.trim().toUpperCase();
  if (trimmed === "AND" || trimmed === "OR") return trimmed;
  return null;
}

/** DB 保存用に tagFilter を正規化（空なら ""） */
export function normalizeDiaryBookTagFilterStorage(raw: string): string {
  const tags = parseDiaryTagInput(raw);
  if (tags.length === 0) return "";
  return formatDiaryTagsLine(tags);
}

export function diaryBookTagScopeFromRow(row: {
  tagFilter?: string | null;
  tagFilterMode?: string | null;
}): DiaryBookTagScope {
  const tagFilter = normalizeDiaryBookTagFilterStorage(row.tagFilter ?? "");
  const mode = normalizeDiaryBookTagFilterMode(row.tagFilterMode ?? "AND") ?? "AND";
  return {
    tagFilter,
    tagFilterMode: tagFilter.length > 0 ? mode : "AND",
  };
}

export function hasDiaryBookTagScope(scope: DiaryBookTagScope): boolean {
  return scope.tagFilter.trim().length > 0;
}

export function formatDiaryBookTagFilterModeLabel(mode: DiaryBookTagFilterMode): string {
  return mode === "AND" ? "すべて含む" : "どれか含む";
}

/** 詳細画面など向け（例: `#こども #おでかけ（すべて含む）`） */
export function formatDiaryBookTagScopeSummary(scope: DiaryBookTagScope): string | null {
  if (!hasDiaryBookTagScope(scope)) return null;
  return `${scope.tagFilter}（${formatDiaryBookTagFilterModeLabel(scope.tagFilterMode)}）`;
}

export function parseDiaryBookTagFilterFields(json: unknown):
  | { ok: true; data: DiaryBookTagScope }
  | { ok: false; status: number; code: string; error: string } {
  if (typeof json !== "object" || json === null) {
    return { ok: false, status: 400, code: "BAD_JSON", error: "JSONが不正です。" };
  }

  const rawFilter =
    "tagFilter" in json ? String((json as { tagFilter: unknown }).tagFilter) : "";
  const rawMode =
    "tagFilterMode" in json
      ? String((json as { tagFilterMode: unknown }).tagFilterMode)
      : "AND";

  const tagFilter = normalizeDiaryBookTagFilterStorage(rawFilter);
  if (tagFilter.length === 0) {
    return {
      ok: true,
      data: { tagFilter: "", tagFilterMode: "AND" },
    };
  }

  const tagFilterMode = normalizeDiaryBookTagFilterMode(rawMode);
  if (!tagFilterMode) {
    return {
      ok: false,
      status: 400,
      code: "BAD_TAG_FILTER_MODE",
      error: "検索方法は「すべて含む」または「どれか含む」を選んでください。",
    };
  }

  return { ok: true, data: { tagFilter, tagFilterMode } };
}

/** preview / create API 向け（後方互換: tag 単一フィールド） */
export function parseDiaryBookTagFilterFromRequest(json: unknown): DiaryBookTagScope {
  if (typeof json !== "object" || json === null) {
    return { tagFilter: "", tagFilterMode: "AND" };
  }

  const hasTagFilter = "tagFilter" in json;
  const hasLegacyTag = "tag" in json;
  if (!hasTagFilter && !hasLegacyTag) {
    return { tagFilter: "", tagFilterMode: "AND" };
  }

  const rawFilter = hasTagFilter
    ? String((json as { tagFilter: unknown }).tagFilter)
    : String((json as { tag: unknown }).tag);
  const rawMode =
    "tagFilterMode" in json
      ? String((json as { tagFilterMode: unknown }).tagFilterMode)
      : "OR";

  const tagFilter = normalizeDiaryBookTagFilterStorage(rawFilter);
  if (tagFilter.length === 0) {
    return { tagFilter: "", tagFilterMode: "AND" };
  }

  const tagFilterMode = normalizeDiaryBookTagFilterMode(rawMode) ?? "OR";
  return { tagFilter, tagFilterMode };
}
