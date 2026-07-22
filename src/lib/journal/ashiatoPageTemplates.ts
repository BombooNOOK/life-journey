/**
 * あしあとブック本文「ページのかたち」ラインナップ。
 * 画像は `public/images/ashiato/`。差し替え時は ASSET_VERSION を +1。
 *
 * レイヤー型（案A）:
 * - `*_background.png` … 背景
 * - `*_photo_overlay.png` … 写真枠（写真の上に重ねる）
 * - `*_preview.png` … 一覧・大きく見る用の合成プレビュー
 *
 * すうじ系（キャラ別・1枚完結）:
 * - `ashiato_template_suuji_{standard|irodori}_{slug}.png`
 * - slug: drfukuro / harinezumi / namakemono / risu / kerosion
 */

import {
  companionTypeToTemplateSlug,
  type CompanionTemplateSlug,
} from "@/lib/journal/coverAssets";

const ASHIATO_PAGE_TEMPLATE_ASSET_VERSION = "8";

export const ASHIATO_COMPANION_TEMPLATE_SLUGS = [
  "drfukuro",
  "harinezumi",
  "namakemono",
  "risu",
  "kerosion",
] as const satisfies readonly CompanionTemplateSlug[];

export type AshiatoPageTemplateContentKey =
  | "photo"
  | "date"
  | "mood"
  | "body"
  | "dailyNumber"
  | "themes"
  | "reading";

const CONTENT_LABELS: Record<AshiatoPageTemplateContentKey, string> = {
  photo: "写真",
  date: "日付",
  mood: "気分",
  body: "本文",
  dailyNumber: "今日のすうじ",
  themes: "今月 / 今年のテーマ",
  reading: "鑑定士の読み解き",
};

export function ashiatoPageTemplateContentLabel(
  key: AshiatoPageTemplateContentKey,
): string {
  return CONTENT_LABELS[key];
}

type LayeredFiles = {
  kind: "layered";
  backgroundFileName: string;
  /** 省略可（1枚完結のシンプル枠など） */
  photoOverlayFileName?: string;
  previewFileName: string;
};

type CompanionFiles = {
  kind: "companion";
  /** 一覧・大きく見る用（フクロウ基準） */
  previewFileName: string;
  /** キャラ別本番画像のベース（`_${slug}.png` を付与） */
  companionFileBase: string;
  /** キャラ未着時のフォールバック（標準テンプレ用） */
  fallbackFileName?: string;
};

export type AshiatoPageTemplateDefinition = {
  id: string;
  label: string;
  category: string;
  description: string;
  badges: readonly string[];
  includes: readonly AshiatoPageTemplateContentKey[];
  excludes: readonly AshiatoPageTemplateContentKey[];
  notice: string;
  files: LayeredFiles | CompanionFiles;
};

export const ashiatoPageTemplateOptions = [
  {
    id: "mori_enikki",
    label: "森の絵日記",
    category: "シンプル思い出型",
    description:
      "写真と縦書きの言葉で、今日のあしあとを絵日記のように残します。短めの文章や、印象に残った一場面を残したい日におすすめです。",
    badges: ["写真", "本文", "気分", "縦書き", "シンプル"],
    includes: ["photo", "date", "mood", "body"],
    excludes: ["dailyNumber", "themes", "reading"],
    notice:
      "このテンプレートは、読み解きやすうじは入りません。純粋に思い出帳として残したい方向けです。",
    files: {
      kind: "layered",
      backgroundFileName: "ashiato_template_mori_enikki_background.png",
      previewFileName: "ashiato_template_mori_enikki_preview.png",
    },
  },
  {
    id: "mori_yohaku_note",
    label: "森の余白ノート",
    category: "シンプル思い出型",
    description:
      "写真と言葉をすっきり残せる、余白のあるテンプレートです。長めの文章も、短いひとことも自然に残せます。",
    badges: ["写真", "本文", "気分", "横書き", "シンプル"],
    includes: ["photo", "date", "mood", "body"],
    excludes: ["dailyNumber", "themes", "reading"],
    notice:
      "このテンプレートは、読み解きやすうじは入りません。純粋に思い出帳として残したい方向けです。",
    files: {
      kind: "layered",
      backgroundFileName: "ashiato_template_mori_yohaku_note_background.png",
      photoOverlayFileName: "ashiato_template_mori_yohaku_note_photo_overlay.png",
      previewFileName: "ashiato_template_mori_yohaku_note_preview.png",
    },
  },
  {
    id: "suuji_ashiato_standard",
    label: "すうじとあしあと",
    category: "BambooNOOK標準型 / 白背景 / 製本向き",
    description:
      "すうじ、気分、鑑定士の読み解きを、白背景で読みやすく残せる標準テンプレートです。製本しやすく、すっきり残したい方におすすめです。",
    badges: ["写真", "本文", "気分", "すうじ", "読み解き", "白背景", "製本向き"],
    includes: ["photo", "date", "mood", "body", "dailyNumber", "themes", "reading"],
    excludes: [],
    notice: "白背景で読みやすく、製本しやすい標準版です。",
    files: {
      kind: "companion",
      previewFileName: "ashiato_template_suuji_standard_drfukuro.png",
      companionFileBase: "ashiato_template_suuji_standard",
    },
  },
  {
    id: "suuji_ashiato_irodori",
    label: "すうじとあしあと 彩り",
    category: "BambooNOOK世界観型 / 全面カラー / 特別感重視",
    description:
      "BambooNOOKの世界観をたっぷり入れて、その日のすうじと読み解きを彩り豊かに残せるテンプレートです。特別感のあるページにしたい方におすすめです。",
    badges: ["写真", "本文", "気分", "すうじ", "読み解き", "全面カラー", "特別感"],
    includes: ["photo", "date", "mood", "body", "dailyNumber", "themes", "reading"],
    excludes: [],
    notice:
      "このテンプレートは全面カラーのため、製本時の料金が高くなる場合があります。",
    files: {
      kind: "companion",
      previewFileName: "ashiato_template_suuji_irodori_drfukuro.png",
      companionFileBase: "ashiato_template_suuji_irodori",
    },
  },
] as const satisfies readonly AshiatoPageTemplateDefinition[];

export type AshiatoPageTemplateId = (typeof ashiatoPageTemplateOptions)[number]["id"];

export const DEFAULT_ASHIATO_PAGE_TEMPLATE_ID: AshiatoPageTemplateId =
  "suuji_ashiato_irodori";

export function isAshiatoPageTemplateId(value: string): value is AshiatoPageTemplateId {
  return ashiatoPageTemplateOptions.some((o) => o.id === value);
}

export function normalizeAshiatoPageTemplateId(
  raw: string | null | undefined,
): AshiatoPageTemplateId {
  const t = (raw ?? "").trim();
  if (isAshiatoPageTemplateId(t)) return t;
  return DEFAULT_ASHIATO_PAGE_TEMPLATE_ID;
}

export function isAshiatoPageTemplateRawAllowed(raw: string): boolean {
  const t = raw.trim();
  return t === "" || isAshiatoPageTemplateId(t);
}

export function getAshiatoPageTemplate(
  id: string | null | undefined,
): (typeof ashiatoPageTemplateOptions)[number] {
  const canon = normalizeAshiatoPageTemplateId(id);
  return ashiatoPageTemplateOptions.find((o) => o.id === canon)!;
}

function withCache(fileName: string): string {
  return `/images/ashiato/${fileName}?v=${ASHIATO_PAGE_TEMPLATE_ASSET_VERSION}`;
}

/** 一覧・大きく見る用プレビュー画像 */
export function ashiatoPageTemplatePreviewPath(
  id: AshiatoPageTemplateId | string,
): string {
  const def = getAshiatoPageTemplate(id);
  return withCache(def.files.previewFileName);
}

/** レイヤー型の背景パス（未対応テンプレは null） */
export function ashiatoPageTemplateBackgroundPath(
  id: AshiatoPageTemplateId | string,
): string | null {
  const def = getAshiatoPageTemplate(id);
  if (def.files.kind !== "layered") return null;
  return withCache(def.files.backgroundFileName);
}

/** レイヤー型の写真枠オーバーレイ（未対応テンプレは null） */
export function ashiatoPageTemplatePhotoOverlayPath(
  id: AshiatoPageTemplateId | string,
): string | null {
  const def = getAshiatoPageTemplate(id);
  if (def.files.kind !== "layered") return null;
  const overlay =
    "photoOverlayFileName" in def.files ? def.files.photoOverlayFileName : undefined;
  if (!overlay) return null;
  return withCache(overlay);
}

/**
 * 本番ページ用画像（キャラ別）。
 * レイヤー型は background を返す（枠は別途 photo_overlay）。
 * すうじ標準でキャラ未着のときは fallback。
 */
export function ashiatoPageTemplateBodyPathForCompanion(
  id: AshiatoPageTemplateId | string,
  companionType: string,
): string {
  const def = getAshiatoPageTemplate(id);
  if (def.files.kind === "layered") {
    return withCache(def.files.backgroundFileName);
  }

  const slug = companionTypeToTemplateSlug(companionType);
  return withCache(`${def.files.companionFileBase}_${slug}.png`);
}
