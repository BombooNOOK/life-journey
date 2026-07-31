/**
 * 森ログ生成履歴（メタデータのみ）。
 * 画像・動画本体は端末保存想定。Neon 本テーブルは将来。
 * 将来「ひとやすみの椅子」で一覧・月・タグ・去年の今日に使う。
 */

/**
 * 森ログメディアの種類。
 * - card_image: 森ログカード静止画（PNG / 画像DL）
 * - card_movie: カードに BGM をのせた短い MP4（現在の森ログムービー）
 * - video_memory: 将来の元動画はめ込み系（未実装・予約）
 */
export type MoriLogMediaType = "card_image" | "card_movie" | "video_memory";

/** localStorage に残っている旧 type（読み取り時に正規化する） */
export type MoriLogMediaTypeLegacy = "card" | "movie";

export type MoriLogMediaTypeStored = MoriLogMediaType | MoriLogMediaTypeLegacy;

export const MORI_LOG_MEDIA_TYPES: readonly MoriLogMediaType[] = [
  "card_image",
  "card_movie",
  "video_memory",
] as const;

export type MoriLogOutputFormat = "png" | "jpg" | "mp4";

export type MoriLogStorageKind = "local" | "none" | "remote_temp";

/** ムービーMVPの標準尺（秒）。Step 3 の書き出しでも共用 */
export const MORI_LOG_MOVIE_DEFAULT_DURATION_SEC = 10;

/** 今日の3コマあしあと向けの尺（秒）。コマが多いのでやや長め */
export const MORI_LOG_MOVIE_3KOMA_DURATION_SEC = 12;

export function moriLogMovieDurationSecForTemplate(templateId: string): number {
  return templateId === "kyou_no_3koma_ashiato"
    ? MORI_LOG_MOVIE_3KOMA_DURATION_SEC
    : MORI_LOG_MOVIE_DEFAULT_DURATION_SEC;
}

/**
 * 旧 type → 現行 type。未知の値は null。
 * card → card_image / movie → card_movie
 */
export function normalizeMoriLogMediaType(value: unknown): MoriLogMediaType | null {
  if (value === "card_image" || value === "card_movie" || value === "video_memory") {
    return value;
  }
  if (value === "card") return "card_image";
  if (value === "movie") return "card_movie";
  return null;
}

export function isMoriLogCardImageType(type: MoriLogMediaType): boolean {
  return type === "card_image";
}

export function isMoriLogCardMovieType(type: MoriLogMediaType): boolean {
  return type === "card_movie";
}

export type MoriLogMedia = {
  id: string;
  /** 既存 Journal と同様のユーザー識別（email 等）。未取得時は空文字可 */
  userId: string;
  profileId: string;
  /** 原本あしあと */
  entryId: string;
  type: MoriLogMediaType;
  templateId: string;
  /** card_movie 用。元になった森ログカード履歴の id */
  sourceCardId?: string | null;
  /** card_movie 用。card_image では省略可 */
  bgmId?: string | null;
  durationSec?: number | null;
  /** 日本暦 YYYY-MM-DD（去年の今日の鍵） */
  entryDateKey: string;
  /** 生成時点のタグ写し */
  tags: string[];
  mood?: string | null;
  companionType?: string | null;
  title?: string | null;
  captionText?: string | null;
  hashtags: string[];
  outputFormat: MoriLogOutputFormat;
  createdAt: string;
  storage: MoriLogStorageKind;
  localUri?: string | null;
  remoteUrl?: string | null;
  contentHash?: string | null;
  isPremiumAsset?: boolean;
  sourcePackId?: string | null;
};

export type MoriLogMediaCreateInput = Omit<MoriLogMedia, "id" | "createdAt"> & {
  id?: string;
  createdAt?: string;
};

export function createMoriLogMediaId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `mori-log-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

/** カード静止画履歴 */
export function buildMoriLogCardImageCreateInput(input: {
  userId: string;
  profileId: string;
  entryId: string;
  templateId: string;
  entryDateKey: string;
  tags: string[];
  mood?: string | null;
  companionType?: string | null;
  title?: string | null;
}): MoriLogMediaCreateInput {
  return {
    userId: input.userId,
    profileId: input.profileId,
    entryId: input.entryId,
    type: "card_image",
    templateId: input.templateId,
    bgmId: null,
    entryDateKey: input.entryDateKey,
    tags: [...input.tags],
    mood: input.mood ?? null,
    companionType: input.companionType ?? null,
    title: input.title ?? null,
    captionText: null,
    hashtags: [],
    outputFormat: "png",
    storage: "local",
    localUri: null,
    remoteUrl: null,
  };
}

/** カード＋BGM ムービー履歴（本体MP4はまだ無くてもメタだけ残せる） */
export function buildMoriLogMovieCreateInput(input: {
  userId: string;
  profileId: string;
  entryId: string;
  templateId: string;
  sourceCardId: string;
  bgmId: string;
  entryDateKey: string;
  tags: string[];
  mood?: string | null;
  companionType?: string | null;
  title?: string | null;
  durationSec?: number;
}): MoriLogMediaCreateInput {
  return {
    userId: input.userId,
    profileId: input.profileId,
    entryId: input.entryId,
    type: "card_movie",
    templateId: input.templateId,
    sourceCardId: input.sourceCardId,
    bgmId: input.bgmId,
    durationSec: input.durationSec ?? MORI_LOG_MOVIE_DEFAULT_DURATION_SEC,
    entryDateKey: input.entryDateKey,
    tags: [...input.tags],
    mood: input.mood ?? null,
    companionType: input.companionType ?? null,
    title: input.title ?? null,
    captionText: null,
    hashtags: [],
    outputFormat: "mp4",
    storage: "local",
    localUri: null,
    remoteUrl: null,
  };
}
