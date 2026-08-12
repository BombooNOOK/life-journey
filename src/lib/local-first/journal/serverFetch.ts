/**
 * Authenticated Server Journal GET helpers (cookie session).
 * No Neon credentials. No Server write. Shared by copy services.
 *
 * Optional PoC mode: absolute production origin + session cookie via CapacitorHttp
 * (local diagnostics WebView is not same-origin with production).
 */

import { Capacitor, CapacitorHttp } from "@capacitor/core";

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

type ServerFetchPocConfig = {
  /** Absolute origin, e.g. https://life-journey-zeta.vercel.app */
  apiOrigin: string;
  /** Full Cookie header value (never logged). */
  cookieHeader: string;
};

let pocConfig: ServerFetchPocConfig | null = null;

/** Developer PoC only. Do not call from product UI. */
export function configureServerFetchPoc(config: ServerFetchPocConfig | null): void {
  pocConfig = config;
}

export function getServerFetchPocConfig(): ServerFetchPocConfig | null {
  return pocConfig;
}

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

function mapStatusToFetchErr(status: number): FetchedJournalEntry {
  if (status === 401) {
    return { ok: false, code: "AUTH_REQUIRED", message: "ログインが必要です。" };
  }
  if (status === 404) {
    return { ok: false, code: "NOT_FOUND", message: "対象の記録が見つかりません。" };
  }
  return {
    ok: false,
    code: "FORBIDDEN_OR_MISSING",
    message: `取得に失敗しました (${status})。`,
  };
}

async function getJsonViaCapHttp(url: string): Promise<{ status: number; json: unknown }> {
  if (!pocConfig) throw new Error("server fetch PoC config missing");
  const response = await CapacitorHttp.get({
    url,
    headers: {
      Accept: "application/json",
      Cookie: pocConfig.cookieHeader,
    },
    responseType: "json",
  });
  return { status: response.status, json: response.data };
}

async function getBinaryViaCapHttp(
  url: string,
): Promise<{ status: number; base64: string; mimeType: string; headers: Record<string, string> }> {
  if (!pocConfig) throw new Error("server fetch PoC config missing");
  const response = await CapacitorHttp.get({
    url,
    headers: {
      Cookie: pocConfig.cookieHeader,
    },
    responseType: "blob",
  });
  const headers: Record<string, string> = {};
  for (const [key, value] of Object.entries(response.headers ?? {})) {
    headers[key.toLowerCase()] = String(value);
  }
  const raw = typeof response.data === "string" ? response.data : "";
  // Native may prefix data URL
  const base64 = raw.includes(",") ? raw.split(",", 2)[1]! : raw;
  return {
    status: response.status,
    base64,
    mimeType: headers["content-type"] || "application/octet-stream",
    headers,
  };
}

export async function fetchAuthenticatedJournalEntry(
  entryId: string,
): Promise<FetchedJournalEntry> {
  if (pocConfig && Capacitor.isNativePlatform()) {
    const url = `${pocConfig.apiOrigin.replace(/\/$/, "")}/api/journal/${encodeURIComponent(entryId)}`;
    try {
      const { status, json } = await getJsonViaCapHttp(url);
      if (status >= 400) return mapStatusToFetchErr(status);
      const body = json as { entry?: ApiJournalEntry };
      if (!body.entry?.id) {
        return { ok: false, code: "VALIDATION", message: "レスポンスに entry がありません。" };
      }
      return { ok: true, entry: body.entry };
    } catch {
      return {
        ok: false,
        code: "FORBIDDEN_OR_MISSING",
        message: "取得に失敗しました。",
      };
    }
  }

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
  if (pocConfig && Capacitor.isNativePlatform()) {
    const url = `${pocConfig.apiOrigin.replace(/\/$/, "")}${journalEntryPhotoApiPath(entryId)}`;
    try {
      const binary = await getBinaryViaCapHttp(url);
      if (binary.status >= 400) {
        if (fallbackDataUrl) {
          const parsed = fromDataUrl(fallbackDataUrl);
          if (parsed) return parsed;
        }
        return { ok: false, message: `写真取得失敗 (${binary.status})` };
      }
      const contentType = binary.mimeType;
      if (contentType.includes("application/json")) {
        // CapHttp may have decoded JSON into object already when content-type is json;
        // for blob mode we expect base64 string — try fallback.
        if (fallbackDataUrl) {
          const parsed = fromDataUrl(fallbackDataUrl);
          if (parsed) return parsed;
        }
        return { ok: false, message: "写真JSONの取得に失敗しました。" };
      }
      if (!binary.base64) {
        return { ok: false, message: "写真が空です。" };
      }
      const padding = binary.base64.match(/=+$/)?.[0].length ?? 0;
      const byteLength = Math.floor((binary.base64.length * 3) / 4) - padding;
      return {
        ok: true,
        base64: binary.base64,
        byteLength,
        mimeType: contentType || "application/octet-stream",
      };
    } catch {
      if (fallbackDataUrl) {
        const parsed = fromDataUrl(fallbackDataUrl);
        if (parsed) return parsed;
      }
      return { ok: false, message: "写真取得失敗" };
    }
  }

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
