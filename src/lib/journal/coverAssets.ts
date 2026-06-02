import type { CompanionType } from "@/lib/journal/meta";
import { isCompanionType } from "@/lib/journal/meta";

/**
 * 製本表紙デザイン（罫線なし・2種）。
 * 本文テンプレの designTheme とは別管理。
 */
export const diaryCoverStyleOptions = [
  { id: "kireime", label: "きれいめ" },
  { id: "casual", label: "シンプル" },
] as const;

export type DiaryCoverStyleId = (typeof diaryCoverStyleOptions)[number]["id"];

/** 伴走キャラ → ファイル名 slug（フクロウのみ dr、他はローマ字） */
export const diaryCompanionTemplateSlug: Record<CompanionType, string> = {
  owl: "drfukuro",
  hedgehog: "harinezumi",
  sloth: "namakemono",
  squirrel: "risu",
  frog: "kerosion",
};

export function companionTypeToTemplateSlug(companionType: string): string {
  if (isCompanionType(companionType)) return diaryCompanionTemplateSlug[companionType];
  return diaryCompanionTemplateSlug.owl;
}

export function isDiaryCoverStyleId(value: string): value is DiaryCoverStyleId {
  return diaryCoverStyleOptions.some((o) => o.id === value);
}

/** API 保存用（旧 simple / simple_plain も受け付ける） */
export function isDiaryCoverStyleRawAllowed(raw: string): boolean {
  const t = raw.trim();
  if (t === "") return true;
  if (isDiaryCoverStyleId(t)) return true;
  return (
    t === "simple" ||
    t === "simple_plain" ||
    t === "cute" ||
    t === "cute_plain"
  );
}

/** 旧 coverTheme（simple / simple_plain）を表紙スタイルへ読み替え */
export function normalizeDiaryCoverStyle(raw: string | null | undefined): DiaryCoverStyleId {
  const t = (raw ?? "").trim();
  if (t === "kireime" || t === "cute" || t === "cute_plain" || t === "simple_plain") {
    return "kireime";
  }
  if (t === "casual" || t === "simple") return "casual";
  if (isDiaryCoverStyleId(t)) return t;
  return "casual";
}

export function getDiaryCoverStyleLabel(id: string): string {
  const canon = normalizeDiaryCoverStyle(id);
  return diaryCoverStyleOptions.find((o) => o.id === canon)?.label ?? "シンプル";
}

/**
 * 表紙 PNG（724×1024 想定・罫線なし）
 * 例: diary-cover-kireime-harinezumi.png
 */
const COVER_IMAGE_CACHE_VERSION = "1";

export function diaryCoverImagePath(
  coverStyle: DiaryCoverStyleId | string,
  companionType: string,
): string {
  const style = normalizeDiaryCoverStyle(coverStyle);
  const slug = companionTypeToTemplateSlug(companionType);
  return `/images/diary-cover-${style}-${slug}.png?v=${COVER_IMAGE_CACHE_VERSION}`;
}
