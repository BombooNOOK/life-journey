/**
 * 森ログ「投稿の準備」用キャプション組み立て（pure）。
 * SNSへ自動投稿はしない。下書きテキストのみ。
 */

/** SNS投稿用の森ブランド固定ハッシュタグ（管理側 #BambooNOOK とは別用途） */
export const BAMBOO_NOOK_FOREST_HASHTAG = "#BambooNOOKの森" as const;

/** SNS投稿用のサービス固定ハッシュタグ */
export const LIFE_JOURNEY_DIARY_HASHTAG = "#LifeJourneyDiary" as const;

/** 末尾に常に付ける固定ハッシュタグ（この順・各1回） */
export const MORI_LOG_SHARE_FIXED_HASHTAGS = [
  BAMBOO_NOOK_FOREST_HASHTAG,
  LIFE_JOURNEY_DIARY_HASHTAG,
] as const;

const FIXED_HASHTAG_NAMES = new Set(
  MORI_LOG_SHARE_FIXED_HASHTAGS.map((tag) => normalizeTagName(tag).toLowerCase()),
);

export type MoriLogShareCaptionSourceOrigin = "diary" | "device_video";

export type BuildMoriLogShareCaptionInput = {
  /** あしあと本文（タグ行を除いた本文）。無い／取得失敗時は null/空 */
  body?: string | null;
  /** タイトル（映写便り、または本文フォールバック） */
  title?: string | null;
  /** 投稿候補タグ（通常は media.tags。# あり／なし両対応） */
  tags?: readonly string[] | null;
  /** 将来アルバム等で参照。現状の組み立てでは prose 優先規則にのみ関与 */
  sourceOrigin?: MoriLogShareCaptionSourceOrigin;
};

export type BuildMoriLogShareCaptionResult = {
  text: string;
  /** `#` 付き。末尾に固定タグを各1回だけ含む */
  hashtags: string[];
};

function normalizeTagName(raw: string): string {
  return raw.replace(/^#+/u, "").trim();
}

function isFixedBrandTagName(name: string): boolean {
  return FIXED_HASHTAG_NAMES.has(name.toLowerCase());
}

/** 利用者タグ（固定ブランドタグを除く）→ `#名` */
export function buildMoriLogShareUserHashtags(
  tags: readonly string[] | null | undefined,
): string[] {
  const out: string[] = [];
  const seen = new Set<string>();

  for (const raw of tags ?? []) {
    if (typeof raw !== "string") continue;
    const name = normalizeTagName(raw);
    if (!name) continue;
    if (isFixedBrandTagName(name)) continue;
    const key = name.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(`#${name}`);
  }

  return out;
}

/** タグ配列 → `#名` リスト（利用者タグ＋固定タグ。重複除去） */
export function buildMoriLogShareHashtags(
  tags: readonly string[] | null | undefined,
): string[] {
  return [...buildMoriLogShareUserHashtags(tags), ...MORI_LOG_SHARE_FIXED_HASHTAGS];
}

/**
 * 投稿用キャプション下書きを組み立てる。
 * - 本文があれば本文優先
 * - なければタイトル
 * - 末尾にタグ行：
 *   #利用者タグ…
 *   #BambooNOOKの森 #LifeJourneyDiary
 */
export function buildMoriLogShareCaption(
  input: BuildMoriLogShareCaptionInput,
): BuildMoriLogShareCaptionResult {
  const userHashtags = buildMoriLogShareUserHashtags(input.tags);
  const hashtags = [...userHashtags, ...MORI_LOG_SHARE_FIXED_HASHTAGS];
  const fixedLine = MORI_LOG_SHARE_FIXED_HASHTAGS.join(" ");
  const userLine = userHashtags.join(" ");
  const hashtagBlock = userLine ? `${userLine}\n${fixedLine}` : fixedLine;

  const body = (input.body ?? "").replace(/\r\n/g, "\n").replace(/\r/g, "\n").trimEnd();
  const title = (input.title ?? "").trim();

  const prose = body.trim().length > 0 ? body : title;
  const text = prose ? `${prose}\n\n${hashtagBlock}` : hashtagBlock;

  return { text, hashtags };
}
