/**
 * Server → Device read-only copy (Phase 4B-2C).
 * Uses authenticated cookie session APIs only — no Neon credentials in native.
 * Does not update/delete/own server records.
 */

import { Capacitor } from "@capacitor/core";

import { calendarDayKeyInJapanFromDate } from "@/lib/date/japanCalendarDate";
import { extractTagsFromContent } from "@/lib/journal/diaryTags";
import { journalEntryPhotoApiPath } from "@/lib/journal/journalEntryPhotoPath";
import { mapServerJournalEntryLikeToLocal } from "@/lib/local-first/journal/mapper";
import {
  deleteJournalMediaRelative,
  readJournalMediaBase64,
  sha256HexOfBase64,
  writeJournalMediaRelative,
} from "@/lib/local-first/journal/mediaStore";
import { JournalRepository } from "@/lib/local-first/journal/repository";
import { createLocalStableId } from "@/lib/local-first/journal/stableId";
import type {
  LocalJournalEntry,
  ServerJournalEntryLike,
} from "@/lib/local-first/journal/types";

export type MigrationSizeReport = {
  contentChars: number;
  metaJsonBytesApprox: number;
  photoBytes: number;
  relativePath: string | null;
  checksum: string | null;
};

export type MigrationOk = {
  ok: true;
  status: "created" | "already_present";
  entry: LocalJournalEntry;
  sizes: MigrationSizeReport;
};

export type MigrationErr = {
  ok: false;
  code:
    | "NOT_NATIVE"
    | "AUTH_REQUIRED"
    | "NOT_FOUND"
    | "FORBIDDEN_OR_MISSING"
    | "PHOTO_FAILED"
    | "VALIDATION"
    | "SQLITE_FAILED"
    | "UNKNOWN";
  message: string;
};

export type MigrationResult = MigrationOk | MigrationErr;

type ApiJournalEntry = {
  id: string;
  content: string;
  createdAt: string;
  updatedAt: string;
  profileId?: string;
  mood?: string;
  activity?: string;
  companionType?: string;
  designTheme?: string;
  contentFontMode?: string;
  generatedComment?: string | null;
  includeInBook?: boolean;
  hasPhoto?: boolean;
  photoSrc?: string | null;
  photoDataUrl?: string | null;
  diaryNumbers?: unknown;
};

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunk));
  }
  return btoa(binary);
}

function titleFromContent(content: string): string {
  const body = extractTagsFromContent(content).body.trim();
  const first = body.split(/\n/)[0]?.trim() ?? "";
  if (!first) return "無題のあしあと";
  return first.length > 40 ? `${first.slice(0, 40)}…` : first;
}

function toServerLike(entry: ApiJournalEntry): ServerJournalEntryLike {
  const extracted = extractTagsFromContent(entry.content);
  const tags = extracted.tags.map((t) => (t.startsWith("#") ? t : `#${t}`));
  const created = new Date(entry.createdAt);
  return {
    id: entry.id,
    createdAt: entry.createdAt,
    updatedAt: entry.updatedAt,
    email: "",
    profileId: entry.profileId ?? "",
    content: entry.content,
    mood: entry.mood ?? "calm",
    activity: entry.activity ?? "record_anyway",
    companionType: entry.companionType ?? "owl",
    designTheme: entry.designTheme ?? "simple",
    contentFontMode: entry.contentFontMode ?? "standard",
    photoDataUrl: entry.photoDataUrl ?? null,
    photoBlobUrl: null,
    photoBlobPathname: null,
    photoMimeType: null,
    photoSizeBytes: null,
    photoStorageProvider: null,
    generatedComment: entry.generatedComment ?? null,
    includeInBook: entry.includeInBook ?? true,
    dateKey: Number.isFinite(created.getTime())
      ? calendarDayKeyInJapanFromDate(created)
      : calendarDayKeyInJapanFromDate(new Date()),
    title: titleFromContent(entry.content),
    tags,
  };
}

async function fetchEntryJson(entryId: string): Promise<
  | { ok: true; entry: ApiJournalEntry }
  | { ok: false; code: MigrationErr["code"]; message: string }
> {
  const res = await fetch(`/api/journal/${encodeURIComponent(entryId)}`, {
    credentials: "same-origin",
    headers: { Accept: "application/json" },
  });
  if (res.status === 401) {
    return { ok: false, code: "AUTH_REQUIRED", message: "ログインが必要です。" };
  }
  if (res.status === 404) {
    return { ok: false, code: "NOT_FOUND", message: "対象の記録が見つかりません。" };
  }
  if (!res.ok) {
    return {
      ok: false,
      code: "FORBIDDEN_OR_MISSING",
      message: `取得に失敗しました (${res.status})。`,
    };
  }
  const json = (await res.json()) as { entry?: ApiJournalEntry; code?: string };
  if (!json.entry?.id) {
    return { ok: false, code: "VALIDATION", message: "レスポンスに entry がありません。" };
  }
  return { ok: true, entry: json.entry };
}

async function downloadPhotoBase64(
  entryId: string,
  fallbackDataUrl: string | null | undefined,
): Promise<
  | { ok: true; base64: string; byteLength: number; mimeType: string }
  | { ok: false; message: string }
> {
  const fromDataUrl = (dataUrl: string) => {
    const m = /^data:([^;,]+)?;base64,(.+)$/i.exec(dataUrl.trim());
    if (!m?.[2]) return null;
    const base64 = m[2];
    const mimeType = m[1] || "image/jpeg";
    // approximate byte length from base64
    const padding = (base64.match(/=+$/)?.[0].length ?? 0);
    const byteLength = Math.floor((base64.length * 3) / 4) - padding;
    return { ok: true as const, base64, byteLength, mimeType };
  };

  const res = await fetch(journalEntryPhotoApiPath(entryId), {
    credentials: "same-origin",
  });
  if (!res.ok) {
    if (fallbackDataUrl) {
      const parsed = fromDataUrl(fallbackDataUrl);
      if (parsed) return parsed;
    }
    return { ok: false, message: `写真取得失敗 (${res.status})` };
  }

  const contentType = res.headers.get("Content-Type") ?? "";
  if (contentType.includes("application/json")) {
    const json = (await res.json()) as { photoDataUrl?: string | null };
    if (json.photoDataUrl) {
      const parsed = fromDataUrl(json.photoDataUrl);
      if (parsed) return parsed;
    }
    if (fallbackDataUrl) {
      const parsed = fromDataUrl(fallbackDataUrl);
      if (parsed) return parsed;
    }
    return { ok: false, message: "写真JSONに data URL がありません。" };
  }

  const mimeType = contentType || "application/octet-stream";
  const buf = await res.arrayBuffer();
  if (buf.byteLength === 0) {
    return { ok: false, message: "写真が空です。" };
  }
  return {
    ok: true,
    base64: arrayBufferToBase64(buf),
    byteLength: buf.byteLength,
    mimeType,
  };
}

/**
 * Copy one authenticated JournalEntry onto device.
 * Unit = entry + optional media. Partial success is rolled back.
 */
export async function migrateServerJournalEntryToDevice(
  entryId: string,
): Promise<MigrationResult> {
  if (!Capacitor.isNativePlatform()) {
    return {
      ok: false,
      code: "NOT_NATIVE",
      message: "この操作はネイティブアプリでのみ利用できます。",
    };
  }

  const id = entryId.trim();
  if (!id) {
    return { ok: false, code: "VALIDATION", message: "entry ID を入力してください。" };
  }

  // Stage 1: dedupe by legacyServerId (no new ULID if already present)
  const existing = await JournalRepository.findByLegacyServerId(id);
  if (existing) {
    return {
      ok: true,
      status: "already_present",
      entry: existing,
      sizes: {
        contentChars: existing.content.length,
        metaJsonBytesApprox: JSON.stringify({
          stableId: existing.stableId,
          legacyServerId: existing.legacyServerId,
        }).length,
        photoBytes: 0,
        relativePath: existing.mediaRefs[0]?.relativePath ?? null,
        checksum: existing.mediaRefs[0]?.checksum ?? null,
      },
    };
  }

  // Stage 2: authenticated fetch (no content logged)
  const fetched = await fetchEntryJson(id);
  if (!fetched.ok) {
    return { ok: false, code: fetched.code, message: fetched.message };
  }
  const apiEntry = fetched.entry;

  // Stage 3: photo download (required for success when hasPhoto)
  let photoBase64: string | null = null;
  let photoBytes = 0;
  let photoMime: string | null = null;
  let checksum: string | null = null;
  const needsPhoto = apiEntry.hasPhoto === true || Boolean(apiEntry.photoSrc);

  if (needsPhoto) {
    const photo = await downloadPhotoBase64(apiEntry.id, apiEntry.photoDataUrl);
    if (!photo.ok) {
      return { ok: false, code: "PHOTO_FAILED", message: photo.message };
    }
    photoBase64 = photo.base64;
    photoBytes = photo.byteLength;
    photoMime = photo.mimeType;
    checksum = await sha256HexOfBase64(photo.base64);
  }

  // Stage 4: map (diaryNumbers intentionally not stored as life-record original)
  const journalStableId = createLocalStableId();
  const mediaStableId = createLocalStableId();
  let relativePath: string | null = null;

  if (photoBase64 && checksum) {
    const ext = photoMime?.includes("png")
      ? "png"
      : photoMime?.includes("webp")
        ? "webp"
        : "jpg";
    relativePath = await writeJournalMediaRelative(
      `${journalStableId}-${mediaStableId}.${ext}`,
      photoBase64,
    );
    // Stage 5: re-read from Filesystem and verify checksum matches download
    try {
      const written = await readJournalMediaBase64(relativePath);
      const verify = await sha256HexOfBase64(written);
      if (verify !== checksum) {
        await deleteJournalMediaRelative(relativePath);
        return {
          ok: false,
          code: "PHOTO_FAILED",
          message: "写真の整合性確認に失敗しました（書込後不一致）。",
        };
      }
    } catch (err) {
      await deleteJournalMediaRelative(relativePath);
      return {
        ok: false,
        code: "PHOTO_FAILED",
        message: `写真の再読込確認に失敗しました: ${String(err)}`,
      };
    }
  }

  const serverLike = toServerLike(apiEntry);
  if (photoMime) serverLike.photoMimeType = photoMime;
  if (photoBytes) serverLike.photoSizeBytes = photoBytes;

  const local = mapServerJournalEntryLikeToLocal(serverLike, {
    journalStableId,
    mediaStableId: relativePath ? mediaStableId : undefined,
    mediaRelativePath: relativePath,
    mediaChecksum: checksum,
    source: "migrated_server",
  });

  // Stage 6: persist Local model. Media file rolled back if SQLite write fails.
  // Note: Cap SQLite + Filesystem are separate systems; we treat entry+media as one
  // logical unit by deleting the written media on DB failure (best-effort staging).
  try {
    await JournalRepository.save(local);
  } catch (err) {
    if (relativePath) await deleteJournalMediaRelative(relativePath);
    return {
      ok: false,
      code: "SQLITE_FAILED",
      message: `端末への保存に失敗しました: ${String(err)}`,
    };
  }

  // Confirm readable from Local (not server)
  const stored = await JournalRepository.getById(local.stableId);
  if (!stored) {
    if (relativePath) await deleteJournalMediaRelative(relativePath);
    return {
      ok: false,
      code: "SQLITE_FAILED",
      message: "保存後の読込確認に失敗しました。",
    };
  }

  return {
    ok: true,
    status: "created",
    entry: stored,
    sizes: {
      contentChars: stored.content.length,
      metaJsonBytesApprox: JSON.stringify({
        stableId: stored.stableId,
        legacyServerId: stored.legacyServerId,
        dateKey: stored.dateKey,
        tags: stored.tags,
        media: stored.mediaRefs.map((m) => m.relativePath),
      }).length,
      photoBytes,
      relativePath,
      checksum,
    },
  };
}
