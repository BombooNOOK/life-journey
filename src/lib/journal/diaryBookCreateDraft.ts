/**
 * あしあとブック作成フォームの途中離脱（はみ出し編集など）からの再開用。
 * sessionStorage に下書きを置き、`/orders/bookshelf?createBook=1` で復元する。
 */

import {
  DEFAULT_ASHIATO_PAGE_TEMPLATE_ID,
  isAshiatoPageTemplateId,
  type AshiatoPageTemplateId,
} from "@/lib/journal/ashiatoPageTemplates";
import {
  ashiatoCoverOptions,
  type AshiatoCoverId,
} from "@/lib/journal/coverAssets";

export const DIARY_BOOK_CREATE_RESUME_PATH = "/orders/bookshelf?createBook=1" as const;

const STORAGE_KEY = "ljd.diaryBookCreate.draft.v1";

export type DiaryBookCreateDraftV1 = {
  version: 1;
  title: string;
  startDate: string;
  endDate: string;
  coverTheme: AshiatoCoverId;
  pageTemplate: AshiatoPageTemplateId;
  tagFilter: string;
  /** 掲載一覧まで確認済みなら、戻り時に再取得する */
  periodChecked: boolean;
  open: boolean;
};

function canUseSessionStorage(): boolean {
  return typeof window !== "undefined" && typeof window.sessionStorage !== "undefined";
}

function isAshiatoCoverId(value: string): value is AshiatoCoverId {
  return ashiatoCoverOptions.some((opt) => opt.id === value);
}

export function isDiaryBookCreateResumePath(path: string | null | undefined): boolean {
  if (!path) return false;
  try {
    const decoded = decodeURIComponent(path.trim());
    const qIndex = decoded.indexOf("?");
    const pathPart = qIndex >= 0 ? decoded.slice(0, qIndex) : decoded;
    if (pathPart !== "/orders/bookshelf") return false;
    if (qIndex < 0) return false;
    return new URLSearchParams(decoded.slice(qIndex + 1)).get("createBook") === "1";
  } catch {
    return false;
  }
}

export function readDiaryBookCreateDraft(): DiaryBookCreateDraftV1 | null {
  if (!canUseSessionStorage()) return null;
  try {
    const raw = window.sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<DiaryBookCreateDraftV1>;
    if (parsed.version !== 1) return null;
    const coverTheme =
      typeof parsed.coverTheme === "string" && isAshiatoCoverId(parsed.coverTheme)
        ? parsed.coverTheme
        : "cover_mori_standard";
    const pageTemplate =
      typeof parsed.pageTemplate === "string" && isAshiatoPageTemplateId(parsed.pageTemplate)
        ? parsed.pageTemplate
        : DEFAULT_ASHIATO_PAGE_TEMPLATE_ID;
    return {
      version: 1,
      title: typeof parsed.title === "string" ? parsed.title : "",
      startDate: typeof parsed.startDate === "string" ? parsed.startDate : "",
      endDate: typeof parsed.endDate === "string" ? parsed.endDate : "",
      coverTheme,
      pageTemplate,
      tagFilter: typeof parsed.tagFilter === "string" ? parsed.tagFilter : "",
      periodChecked: parsed.periodChecked === true,
      open: parsed.open !== false,
    };
  } catch {
    return null;
  }
}

export function writeDiaryBookCreateDraft(
  draft: Omit<DiaryBookCreateDraftV1, "version">,
): void {
  if (!canUseSessionStorage()) return;
  try {
    const payload: DiaryBookCreateDraftV1 = { version: 1, ...draft };
    window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  } catch {
    // ignore quota / private mode
  }
}

export function clearDiaryBookCreateDraft(): void {
  if (!canUseSessionStorage()) return;
  try {
    window.sessionStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
}

export function hasDiaryBookCreateDraft(): boolean {
  return readDiaryBookCreateDraft() != null;
}
