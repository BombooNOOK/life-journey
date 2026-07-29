/**
 * 森ログ生成履歴（メタデータのみ）。
 * 画像・動画本体は端末保存想定。Neon 本テーブルは将来。
 * 将来「ひとやすみの椅子」で一覧・月・タグ・去年の今日に使う。
 */

export type MoriLogMediaType = "card" | "movie";

export type MoriLogOutputFormat = "png" | "jpg" | "mp4";

export type MoriLogStorageKind = "local" | "none" | "remote_temp";

/** ムービーMVPの標準尺（秒）。Step 3 の書き出しでも共用 */
export const MORI_LOG_MOVIE_DEFAULT_DURATION_SEC = 6;

export type MoriLogMedia = {
  id: string;
  /** 既存 Journal と同様のユーザー識別（email 等）。未取得時は空文字可 */
  userId: string;
  profileId: string;
  /** 原本あしあと */
  entryId: string;
  type: MoriLogMediaType;
  templateId: string;
  /** movie 用。元になった森ログカード履歴の id */
  sourceCardId?: string | null;
  /** movie 用。card では省略可 */
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

/** ムービー履歴（本体MP4はまだ無くてもメタだけ残せる） */
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
    type: "movie",
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
