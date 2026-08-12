/**
 * Authenticated Server Journal GET helpers (cookie session).
 * No Neon credentials. No Server write. Shared by copy services.
 */

import { calendarDayKeyInJapanFromDate } from "@/lib/date/japanCalendarDate";
import { extractTagsFromContent } from "@/lib/journal/diaryTags";
import { journalEntryPhotoApiPath } from "@/lib/journal/journalEntryPhotoPath";
import type { ServerJournalEntryLike } from "@/lib/local-first/journal/types";

export type ApiJournalEntry = {
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
};

export type ServerFetchErrCode =
  | "AUTH_REQUIRED"
  | "NOT_FOUND"
  | "FORBIDDEN_OR_MISSING"
  | "VALIDATION"
  | "PHOTO_FAILED";

export type FetchedJournalEntry =
  | { ok: true; entry: ApiJournalEntry }
  | { ok: false; code: ServerFetchErrCode; message: string };

export type DownloadedPhoto =
  | { ok: true; base64: string; byteLength: number; mimeType: string }
  | { ok: false; message: string };

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

export function apiJournalToServerLike(entry: ApiJournalEntry): ServerJournalEntryLike {
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

export function journalEntryNeedsPhoto(entry: ApiJournalEntry): boolean {
  return entry.hasPhoto === true || Boolean(entry.photoSrc);
}

export async function fetchAuthenticatedJournalEntry(
  entryId: string,
): Promise<FetchedJournalEntry> {
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
  const json = (await res.json()) as { entry?: ApiJournalEntry };
  if (!json.entry?.id) {
    return { ok: false, code: "VALIDATION", message: "レスポンスに entry がありません。" };
  }
  return { ok: true, entry: json.entry };
}

function fromDataUrl(dataUrl: string): DownloadedPhoto | null {
  const m = /^data:([^;,]+)?;base64,(.+)$/i.exec(dataUrl.trim());
  if (!m?.[2]) return null;
  const base64 = m[2];
  const mimeType = m[1] || "image/jpeg";
  const padding = base64.match(/=+$/)?.[0].length ?? 0;
  const byteLength = Math.floor((base64.length * 3) / 4) - padding;
  return { ok: true, base64, byteLength, mimeType };
}

export async function downloadJournalPhotoBase64(
  entryId: string,
  fallbackDataUrl?: string | null,
): Promise<DownloadedPhoto> {
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

  const buf = await res.arrayBuffer();
  if (buf.byteLength === 0) {
    return { ok: false, message: "写真が空です。" };
  }
  return {
    ok: true,
    base64: arrayBufferToBase64(buf),
    byteLength: buf.byteLength,
    mimeType: contentType || "application/octet-stream",
  };
}
