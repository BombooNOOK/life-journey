/**
 * 端末動画プレビュー結果を card_movie として端末内に保存する（Phase B/C）。
 * 初期は billingStatus: pending。どんぐり確定後に confirmed にする。
 * 明確な失敗時は不完全データを残さない。
 */

import type { ComposeMoriLogDeviceMovieResult } from "@/lib/journal/moriLog/composeMoriLogDeviceMovieTypes";
import {
  DEVICE_MOVIE_DEFAULT_TITLE,
  DEVICE_MOVIE_TEMPLATE_ID,
} from "@/lib/journal/moriLog/deviceMovieComposerCopy";
import {
  DEVICE_MOVIE_BASIC_TEMPLATE_VERSION,
  resolveDeviceMovieDecorationVariant,
} from "@/lib/journal/moriLog/deviceMovieBasicTemplate";
import {
  buildMoriLogDeviceMovieCreateInput,
  createMoriLogMediaId,
  type MoriLogMedia,
  type MoriLogMediaBillingStatus,
} from "@/lib/journal/moriLog/moriLogMedia";
import {
  MORI_LOG_MEDIA_BLOB_URI,
  putMoriLogMediaBlob,
  putMoriLogMediaPosterBlob,
  removeMoriLogMediaBlob,
} from "@/lib/journal/moriLog/moriLogMediaBlobStore";
import { getMoriLogMediaStore } from "@/lib/journal/moriLog/moriLogMediaStore";

/** 完成日の利用者ローカル暦日 YYYY-MM-DD */
export function deviceMovieLocalEntryDateKey(now = new Date()): string {
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export type SaveDeviceMovieToMoriLogInput = {
  profileId: string;
  userId?: string;
  title: string;
  result: ComposeMoriLogDeviceMovieResult;
  /** Phase D2: BGM のとき selected id。original/mute は null */
  bgmId?: string | null;
  /** 端末動画の音声モード。未設定は result.audioMode */
  audioMode?: "original" | "mute" | "bgm" | null;
  /** 復旧再送時は既存 mediaId を渡す。新規は省略して発行 */
  mediaId?: string;
};

/**
 * 保存順: ポスター → 動画 → メタ(pending)。
 * いずれか失敗したら Blob / メタを可能な限り削除する。
 */
export async function saveDeviceMovieToMoriLog(
  input: SaveDeviceMovieToMoriLogInput,
): Promise<MoriLogMedia> {
  const profileId = input.profileId.trim();
  if (!profileId) {
    throw new Error("profileId is required");
  }
  if (!input.result.movieBlob || input.result.movieBlob.size <= 0) {
    throw new Error("movie blob is empty");
  }
  if (!input.result.posterBlob || input.result.posterBlob.size <= 0) {
    throw new Error("poster blob is empty");
  }

  const mediaId = (input.mediaId ?? "").trim() || createMoriLogMediaId();
  let posterSaved = false;
  let movieSaved = false;
  let metaSaved = false;

  try {
    await putMoriLogMediaPosterBlob(mediaId, input.result.posterBlob);
    posterSaved = true;

    await putMoriLogMediaBlob(mediaId, input.result.movieBlob);
    movieSaved = true;

    const title = input.title.trim() || DEVICE_MOVIE_DEFAULT_TITLE;
    const media = await getMoriLogMediaStore().upsert({
      ...buildMoriLogDeviceMovieCreateInput({
        id: mediaId,
        userId: input.userId ?? "",
        profileId,
        templateId: input.result.templateId ?? DEVICE_MOVIE_TEMPLATE_ID,
        templateVersion:
          input.result.templateVersion ?? DEVICE_MOVIE_BASIC_TEMPLATE_VERSION,
        templateDecorationVariant: resolveDeviceMovieDecorationVariant(
          input.result.templateDecorationVariant,
        ),
        entryDateKey:
          input.result.createdDateKey?.trim() || deviceMovieLocalEntryDateKey(),
        title,
        durationSec: input.result.durationSec,
        bgmId: input.bgmId ?? input.result.bgmId ?? null,
        audioMode: input.audioMode ?? input.result.audioMode ?? null,
      }),
      billingStatus: "pending",
      localUri: MORI_LOG_MEDIA_BLOB_URI,
    });
    metaSaved = true;
    return media;
  } catch (error) {
    try {
      if (metaSaved) {
        await getMoriLogMediaStore().remove(mediaId, profileId);
      }
    } catch {
      // ignore cleanup errors
    }
    try {
      if (posterSaved || movieSaved) {
        await removeMoriLogMediaBlob(mediaId);
      }
    } catch {
      // ignore cleanup errors
    }
    throw error;
  }
}

export async function setDeviceMovieBillingStatus(params: {
  mediaId: string;
  profileId: string;
  billingStatus: MoriLogMediaBillingStatus;
}): Promise<MoriLogMedia | null> {
  const store = getMoriLogMediaStore();
  const existing = await store.get(params.mediaId, params.profileId);
  if (!existing) return null;
  return store.upsert({
    ...existing,
    billingStatus: params.billingStatus,
  });
}

/** 明確な失敗時: pending メタと Blob を削除 */
export async function discardPendingDeviceMovie(params: {
  mediaId: string;
  profileId: string;
}): Promise<void> {
  const mediaId = params.mediaId.trim();
  const profileId = params.profileId.trim();
  if (!mediaId || !profileId) return;
  try {
    await getMoriLogMediaStore().remove(mediaId, profileId);
  } catch {
    // ignore
  }
  try {
    await removeMoriLogMediaBlob(mediaId);
  } catch {
    // ignore
  }
}
