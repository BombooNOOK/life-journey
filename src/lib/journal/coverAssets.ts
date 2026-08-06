/**
 * あしあとブック表紙ラインナップ（作成時選択）。
 * 画像は `public/images/ashiato/`。差し替え時は ASSET_VERSION を +1。
 */

const ASHIATO_COVER_ASSET_VERSION = "1";

export const ashiatoCoverOptions = [
  {
    id: "cover_mori_standard",
    label: "森のあしあと",
    description: "BambooNOOKらしい標準の表紙です。はじめてのあしあとブックにおすすめです。",
    fileName: "ashiato_cover_mori_standard.png",
  },
  {
    id: "cover_komorebi",
    label: "こもれび",
    description: "やさしくかわいい雰囲気の表紙です。あたたかい記録として残したい方におすすめです。",
    fileName: "ashiato_cover_komorebi.png",
  },
  {
    id: "cover_mori_irodori",
    label: "森の彩り",
    description: "少し華やかで、特別感のある表紙です。思い出を彩り豊かに残したい方におすすめです。",
    fileName: "ashiato_cover_mori_irodori.png",
  },
] as const;

export type AshiatoCoverId = (typeof ashiatoCoverOptions)[number]["id"];

/** @deprecated 旧 ID。`normalizeDiaryCoverStyle` 経由で新 ID に読み替える */
export type DiaryCoverStyleId = AshiatoCoverId;

/** 旧 UI 互換エイリアス（id は正規化後の値） */
export const diaryCoverStyleOptions = ashiatoCoverOptions.map((o) => ({
  id: o.id,
  label: o.label,
}));

export function isAshiatoCoverId(value: string): value is AshiatoCoverId {
  return ashiatoCoverOptions.some((o) => o.id === value);
}

/** @deprecated {@link isAshiatoCoverId} */
export function isDiaryCoverStyleId(value: string): value is DiaryCoverStyleId {
  return isAshiatoCoverId(value);
}

/** API 保存用（旧 simple / casual / kireime 等も受け付ける） */
export function isDiaryCoverStyleRawAllowed(raw: string): boolean {
  const t = raw.trim();
  if (t === "") return true;
  if (isAshiatoCoverId(t)) return true;
  return (
    t === "casual" ||
    t === "kireime" ||
    t === "simple" ||
    t === "simple_plain" ||
    t === "cute" ||
    t === "cute_plain"
  );
}

/**
 * 旧 coverTheme を新表紙 ID へ読み替え。
 * - casual / simple → 森のあしあと
 * - kireime / cute* / simple_plain → 森の彩り
 */
export function normalizeDiaryCoverStyle(raw: string | null | undefined): AshiatoCoverId {
  const t = (raw ?? "").trim();
  if (isAshiatoCoverId(t)) return t;
  if (t === "cover_komorebi" || t === "komorebi") return "cover_komorebi";
  if (
    t === "cover_mori_irodori" ||
    t === "kireime" ||
    t === "cute" ||
    t === "cute_plain" ||
    t === "simple_plain"
  ) {
    return "cover_mori_irodori";
  }
  if (t === "cover_mori_standard" || t === "casual" || t === "simple") {
    return "cover_mori_standard";
  }
  return "cover_mori_standard";
}

export function getDiaryCoverStyleLabel(id: string): string {
  const canon = normalizeDiaryCoverStyle(id);
  return ashiatoCoverOptions.find((o) => o.id === canon)?.label ?? "森のあしあと";
}

export function ashiatoCoverImagePath(coverId: AshiatoCoverId | string): string {
  const id = normalizeDiaryCoverStyle(coverId);
  const fileName =
    ashiatoCoverOptions.find((o) => o.id === id)?.fileName ??
    "ashiato_cover_mori_standard.png";
  return `/images/ashiato/${fileName}?v=${ASHIATO_COVER_ASSET_VERSION}`;
}

/**
 * 表紙 PNG パス。
 * 第2引数 companionType は後方互換のため残すが、新表紙はキャラ共通1枚。
 */
export function diaryCoverImagePath(
  coverStyle: AshiatoCoverId | string,
  _companionType?: string,
): string {
  return ashiatoCoverImagePath(coverStyle);
}

/** 伴走キャラ → ファイル名 slug（本文テンプレ等で使用） */
export const diaryCompanionTemplateSlug = {
  owl: "drfukuro",
  hedgehog: "harinezumi",
  sloth: "namakemono",
  squirrel: "risu",
  frog: "kerosion",
} as const;

export type CompanionTemplateSlug =
  (typeof diaryCompanionTemplateSlug)[keyof typeof diaryCompanionTemplateSlug];

export function companionTypeToTemplateSlug(companionType: string): CompanionTemplateSlug {
  if (companionType === "hedgehog") return "harinezumi";
  if (companionType === "sloth") return "namakemono";
  if (companionType === "squirrel") return "risu";
  if (companionType === "frog") return "kerosion";
  return "drfukuro";
}
