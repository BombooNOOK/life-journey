/**
 * 端末動画→森ログムービーの下書き（課金前）。
 * billing pending（通信不明）とは別。プロフィールあたり1件。
 * メタは localStorage、本体 Blob は IndexedDB（既存媒体ストアを流用）。
 *
 * workflowStatus 相当:
 * - draft … 本ストアのレコード（完成前）
 * - billing_pending … MoriLogMedia.billingStatus === "pending"
 * - confirmed … MoriLogMedia.billingStatus !== "pending"（未設定含む）
 */

import type { ComposeMoriLogDeviceMovieResult } from "@/lib/journal/moriLog/composeMoriLogDeviceMovieTypes";
import { DEVICE_MOVIE_TEMPLATE_ID } from "@/lib/journal/moriLog/deviceMovieComposerCopy";
import {
  DEVICE_MOVIE_BASIC_TEMPLATE_VERSION,
  resolveDeviceMovieDecorationVariant,
} from "@/lib/journal/moriLog/deviceMovieBasicTemplate";
import type { MoriLogMediaBillingStatus } from "@/lib/journal/moriLog/moriLogMedia";
import {
  deleteMoriLogMediaBlobExactIds,
  getMoriLogMediaBlob,
  putMoriLogMediaBlob,
} from "@/lib/journal/moriLog/moriLogMediaBlobStore";

const META_PREFIX = "ljd.deviceMovieDraft.v1:";

export type DeviceMovieDraftAudioMode = "original" | "mute" | "bgm";

/** draft / billing_pending / confirmed の区別用（実装はストア分離だが、概念を明示する） */
export type DeviceMovieWorkflowStatus = "draft" | "billing_pending" | "confirmed";

export type DeviceMovieDraftMeta = {
  id: string;
  profileId: string;
  title: string;
  durationSec: number;
  audioMode: DeviceMovieDraftAudioMode;
  /** audioMode === "bgm" のとき */
  bgmId?: string | null;
  bgmName?: string | null;
  templateId: string;
  templateVersion?: number;
  templateDecorationVariant?: "lantern" | "owl" | "quill";
  /** 表示用・利用者ローカル作成日 YYYY-MM-DD */
  createdDateKey?: string;
  mimeType: string;
  fileExtension: "mp4" | "webm";
  width: number;
  height: number;
  updatedAt: string;
};

export class DeviceMovieDraftReplaceRequiredError extends Error {
  readonly code = "DRAFT_REPLACE_REQUIRED" as const;
  readonly existing: DeviceMovieDraftMeta;

  constructor(existing: DeviceMovieDraftMeta) {
    super("DRAFT_REPLACE_REQUIRED");
    this.name = "DeviceMovieDraftReplaceRequiredError";
    this.existing = existing;
  }
}

export function isDeviceMovieDraftReplaceRequiredError(
  error: unknown,
): error is DeviceMovieDraftReplaceRequiredError {
  return error instanceof DeviceMovieDraftReplaceRequiredError;
}

export function resolveDeviceMovieWorkflowStatus(input: {
  /** 端末下書きストアに存在するとき true */
  isLocalDraft?: boolean;
  billingStatus?: MoriLogMediaBillingStatus | null;
}): DeviceMovieWorkflowStatus {
  if (input.isLocalDraft) return "draft";
  if (input.billingStatus === "pending") return "billing_pending";
  return "confirmed";
}

function metaKey(profileId: string): string {
  return `${META_PREFIX}${profileId.trim() || "_"}`;
}

export function deviceMovieDraftMovieBlobId(draftId: string): string {
  return `device-movie-draft:${draftId.trim()}:movie`;
}

export function deviceMovieDraftPosterBlobId(draftId: string): string {
  return `device-movie-draft:${draftId.trim()}:poster`;
}

function createDraftId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `draft-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function getLocalStorage(): Storage | null {
  try {
    const storage = (globalThis as { localStorage?: Storage }).localStorage;
    if (!storage) return null;
    storage.getItem(META_PREFIX);
    return storage;
  } catch {
    return null;
  }
}

const memoryMeta = new Map<string, DeviceMovieDraftMeta>();

function readMeta(profileId: string): DeviceMovieDraftMeta | null {
  const pid = profileId.trim();
  if (!pid) return null;
  const storage = getLocalStorage();
  if (!storage) {
    return memoryMeta.get(pid) ?? null;
  }
  try {
    const raw = storage.getItem(metaKey(pid));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as DeviceMovieDraftMeta;
    if (!parsed?.id || parsed.profileId !== pid) return null;
    return parsed;
  } catch {
    return null;
  }
}

function writeMeta(meta: DeviceMovieDraftMeta): void {
  const storage = getLocalStorage();
  if (!storage) {
    memoryMeta.set(meta.profileId, meta);
    return;
  }
  storage.setItem(metaKey(meta.profileId), JSON.stringify(meta));
}

function clearMetaOnly(profileId: string): void {
  const storage = getLocalStorage();
  if (storage) {
    storage.removeItem(metaKey(profileId));
  } else {
    memoryMeta.delete(profileId.trim());
  }
}

async function removeDraftBlobPair(draftId: string): Promise<void> {
  await deleteMoriLogMediaBlobExactIds([
    deviceMovieDraftMovieBlobId(draftId),
    deviceMovieDraftPosterBlobId(draftId),
  ]);
}

export async function getDeviceMovieDraftMeta(
  profileId: string,
): Promise<DeviceMovieDraftMeta | null> {
  return readMeta(profileId);
}

export async function getDeviceMovieDraft(
  profileId: string,
): Promise<{
  meta: DeviceMovieDraftMeta;
  movieBlob: Blob;
  posterBlob: Blob;
} | null> {
  const meta = readMeta(profileId);
  if (!meta) return null;
  const [movieBlob, posterBlob] = await Promise.all([
    getMoriLogMediaBlob(deviceMovieDraftMovieBlobId(meta.id)),
    getMoriLogMediaBlob(deviceMovieDraftPosterBlobId(meta.id)),
  ]);
  if (!movieBlob || movieBlob.size <= 0 || !posterBlob || posterBlob.size <= 0) {
    return null;
  }
  return { meta, movieBlob, posterBlob };
}

export async function getDeviceMovieDraftById(
  profileId: string,
  draftId: string,
): Promise<{
  meta: DeviceMovieDraftMeta;
  movieBlob: Blob;
  posterBlob: Blob;
} | null> {
  const loaded = await getDeviceMovieDraft(profileId);
  if (!loaded || loaded.meta.id !== draftId.trim()) return null;
  return loaded;
}

/**
 * プロフィール1件。
 * - 同じ draftId の更新は確認なし
 * - 別作品で既存がある場合は replaceExisting が必要（未指定なら ReplaceRequired）
 */
export async function saveDeviceMovieDraft(input: {
  profileId: string;
  title: string;
  audioMode: DeviceMovieDraftAudioMode;
  result: ComposeMoriLogDeviceMovieResult;
  draftId?: string;
  /** true のとき既存下書きを削除して新規に差し替え */
  replaceExisting?: boolean;
}): Promise<DeviceMovieDraftMeta> {
  const profileId = input.profileId.trim();
  if (!profileId) throw new Error("profileId is required");
  if (!input.result.movieBlob?.size || !input.result.posterBlob?.size) {
    throw new Error("draft blobs are empty");
  }

  const existing = readMeta(profileId);
  const requestedId = (input.draftId ?? "").trim();
  const sameDraft = Boolean(existing && requestedId && existing.id === requestedId);

  if (existing && !sameDraft && !input.replaceExisting) {
    throw new DeviceMovieDraftReplaceRequiredError(existing);
  }

  let draftId: string;
  if (sameDraft && existing) {
    draftId = existing.id;
  } else if (existing && input.replaceExisting) {
    clearMetaOnly(profileId);
    await removeDraftBlobPair(existing.id);
    draftId = createDraftId();
  } else {
    draftId = requestedId || createDraftId();
  }

  try {
    await putMoriLogMediaBlob(
      deviceMovieDraftPosterBlobId(draftId),
      input.result.posterBlob,
    );
    await putMoriLogMediaBlob(
      deviceMovieDraftMovieBlobId(draftId),
      input.result.movieBlob,
    );
  } catch (error) {
    // 保存失敗時に不完全な新メタを残さない。同一下書き更新で blob 途中失敗した場合も呼び出し側でエラー表示。
    if (!sameDraft) {
      await removeDraftBlobPair(draftId).catch(() => undefined);
    }
    throw error;
  }

  const meta: DeviceMovieDraftMeta = {
    id: draftId,
    profileId,
    title: input.title.trim() || "森のひとこま",
    durationSec: input.result.durationSec,
    audioMode: input.audioMode,
    bgmId:
      input.audioMode === "bgm"
        ? (input.result.bgmId ?? null)
        : null,
    bgmName:
      input.audioMode === "bgm"
        ? (input.result.bgmName ?? null)
        : null,
    templateId: input.result.templateId ?? DEVICE_MOVIE_TEMPLATE_ID,
    templateVersion:
      input.result.templateVersion ?? DEVICE_MOVIE_BASIC_TEMPLATE_VERSION,
    templateDecorationVariant: resolveDeviceMovieDecorationVariant(
      input.result.templateDecorationVariant,
    ),
    createdDateKey: input.result.createdDateKey,
    mimeType: input.result.mimeType,
    fileExtension: input.result.fileExtension,
    width: input.result.width,
    height: input.result.height,
    updatedAt: new Date().toISOString(),
  };
  writeMeta(meta);
  return meta;
}

export async function clearDeviceMovieDraft(profileId: string): Promise<void> {
  const existing = readMeta(profileId);
  clearMetaOnly(profileId);
  if (existing) {
    await removeDraftBlobPair(existing.id);
  }
}

export function draftToComposeResult(input: {
  meta: DeviceMovieDraftMeta;
  movieBlob: Blob;
  posterBlob: Blob;
}): ComposeMoriLogDeviceMovieResult {
  return {
    movieBlob: input.movieBlob,
    posterBlob: input.posterBlob,
    mimeType: input.meta.mimeType,
    fileExtension: input.meta.fileExtension,
    durationSec: input.meta.durationSec,
    width: input.meta.width,
    height: input.meta.height,
    audioMode: input.meta.audioMode,
    templateId: input.meta.templateId ?? DEVICE_MOVIE_TEMPLATE_ID,
    templateVersion:
      input.meta.templateVersion ?? DEVICE_MOVIE_BASIC_TEMPLATE_VERSION,
    templateDecorationVariant: resolveDeviceMovieDecorationVariant(
      input.meta.templateDecorationVariant,
    ),
    createdDateKey: input.meta.createdDateKey,
    bgmId: input.meta.bgmId ?? null,
    bgmName: input.meta.bgmName ?? null,
  };
}

export function deviceMovieDraftResumePath(draftId: string): string {
  const id = encodeURIComponent(draftId.trim());
  return `/orders/hitoyasumi?view=movie_compose&draftId=${id}`;
}

export function deviceMovieDonguriPathForDraft(draftId: string): string {
  const resume = deviceMovieDraftResumePath(draftId);
  const qs = new URLSearchParams({
    draftId: draftId.trim(),
    returnTo: resume,
  });
  return `/orders/donguri?${qs.toString()}`;
}
