/**
 * AI-7.1 canonical exact POST payload for durable SQLCipher storage.
 *
 * Source of truth is the JSON string we persist — recovery must not rebuild
 * a body from fingerprint fragments. Secrets / email / cookies never enter.
 */

import { isValidClientSaveOperationId } from "@/lib/journal/clientSaveIntent/saveOperationId";
import { DEFAULT_CONTENT_FONT_MODE, isContentFontMode } from "@/lib/journal/contentFontMode";
import {
  isActivityId,
  isAllowedDiaryDesignThemeRaw,
  isCompanionType,
  isMoodId,
  normalizeDiaryDesignTheme,
} from "@/lib/journal/meta";
import {
  buildProductionJournalSaveFingerprint,
  photoIdentityFromPatch,
} from "@/lib/journal/saveIdempotency/productionRequestFingerprint";

/** Matches POST /api/journal photoDataUrl length gate. */
export const JOURNAL_PHOTO_DATA_URL_MAX_CHARS = 2_000_000 as const;
export const JOURNAL_CONTENT_MAX_CHARS = 2000 as const;
/** Photo cap plus JSON wrapper keys. */
export const REQUEST_JSON_MAX_BYTES = 2_100_000 as const;

const FORBIDDEN_REQUEST_KEYS = [
  "email",
  "viewerEmail",
  "actorKey",
  "cookie",
  "cookies",
  "token",
  "authorization",
  "secret",
  "password",
  "passphrase",
] as const;

export type CanonicalJournalSaveRequest = {
  saveOperationId: string;
  content: string;
  entryDate: string;
  profileId: string;
  mood: string;
  activity: string;
  companionType: string;
  designTheme: string;
  contentFontMode: string;
  includeInBook: boolean;
  photoDataUrl?: string;
  photoRemoved?: true;
};

export type CanonicalizeExactPayloadFailure = {
  ok: false;
  code:
    | "save_operation_id_invalid"
    | "content_invalid"
    | "entry_date_invalid"
    | "profile_id_required"
    | "mood_invalid"
    | "activity_invalid"
    | "companion_invalid"
    | "design_theme_invalid"
    | "content_font_mode_invalid"
    | "photo_ambiguous"
    | "photo_too_large"
    | "payload_too_large"
    | "forbidden_key";
};

export type CanonicalizeExactPayloadSuccess = {
  ok: true;
  request: CanonicalJournalSaveRequest;
  requestJson: string;
  requestFingerprint: string;
  requestByteLength: number;
};

function asRecord(value: unknown): Record<string, unknown> | null {
  if (typeof value !== "object" || value === null || Array.isArray(value)) return null;
  return value as Record<string, unknown>;
}

function parseEntryDate(raw: string): string | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(raw.trim());
  if (!m) return null;
  const y = Number(m[1]);
  const mon = Number(m[2]);
  const d = Number(m[3]);
  const probe = new Date(Date.UTC(y, mon - 1, d, 12, 0, 0));
  if (
    probe.getUTCFullYear() !== y ||
    probe.getUTCMonth() !== mon - 1 ||
    probe.getUTCDate() !== d
  ) {
    return null;
  }
  return `${m[1]}-${m[2]}-${m[3]}`;
}

function utf8ByteLength(text: string): number {
  return new TextEncoder().encode(text).length;
}

export function stringifyCanonicalJournalSaveRequest(
  request: CanonicalJournalSaveRequest,
): string {
  const ordered: Record<string, unknown> = {
    saveOperationId: request.saveOperationId,
    content: request.content,
    entryDate: request.entryDate,
    profileId: request.profileId,
    mood: request.mood,
    activity: request.activity,
    companionType: request.companionType,
    designTheme: request.designTheme,
    contentFontMode: request.contentFontMode,
    includeInBook: request.includeInBook,
  };
  if (typeof request.photoDataUrl === "string") {
    ordered.photoDataUrl = request.photoDataUrl;
  }
  if (request.photoRemoved === true) {
    ordered.photoRemoved = true;
  }
  return JSON.stringify(ordered);
}

export function fingerprintCanonicalJournalSaveRequest(
  request: CanonicalJournalSaveRequest,
): string {
  const photoIdentity = request.photoRemoved
    ? photoIdentityFromPatch({ kind: "remove" })
    : request.photoDataUrl
      ? photoIdentityFromPatch({ kind: "set", dataUrl: request.photoDataUrl })
      : photoIdentityFromPatch({ kind: "unchanged" });
  return buildProductionJournalSaveFingerprint({
    content: request.content,
    entryDate: request.entryDate,
    profileId: request.profileId,
    mood: request.mood,
    activity: request.activity,
    companionType: request.companionType,
    designTheme: request.designTheme,
    contentFontMode: request.contentFontMode,
    includeInBook: request.includeInBook,
    photoIdentity,
  });
}

export function canonicalizeExactJournalSavePayload(input: {
  saveOperationId: string;
  payload: unknown;
}): CanonicalizeExactPayloadSuccess | CanonicalizeExactPayloadFailure {
  const body = asRecord(input.payload);
  if (!body) {
    return { ok: false, code: "content_invalid" };
  }
  for (const key of FORBIDDEN_REQUEST_KEYS) {
    if (Object.prototype.hasOwnProperty.call(body, key)) {
      return { ok: false, code: "forbidden_key" };
    }
  }

  const saveOperationId = input.saveOperationId.trim();
  if (!isValidClientSaveOperationId(saveOperationId)) {
    return { ok: false, code: "save_operation_id_invalid" };
  }

  const content =
    typeof body.content === "string" ? body.content.trim() : "";
  if (!content || content.length > JOURNAL_CONTENT_MAX_CHARS) {
    return { ok: false, code: "content_invalid" };
  }

  const entryDate = parseEntryDate(
    typeof body.entryDate === "string" ? body.entryDate : "",
  );
  if (!entryDate) return { ok: false, code: "entry_date_invalid" };

  const profileId =
    typeof body.profileId === "string"
      ? body.profileId.trim()
      : typeof body.effectiveProfileId === "string"
        ? body.effectiveProfileId.trim()
        : "";
  if (!profileId) return { ok: false, code: "profile_id_required" };

  const moodRaw =
    typeof body.mood === "string" && body.mood.trim() ? body.mood.trim() : "calm";
  if (!isMoodId(moodRaw)) return { ok: false, code: "mood_invalid" };

  const activityRaw =
    typeof body.activity === "string" && body.activity.trim()
      ? body.activity.trim()
      : "record_anyway";
  if (!isActivityId(activityRaw)) return { ok: false, code: "activity_invalid" };

  const companionRaw =
    typeof body.companionType === "string" && body.companionType.trim()
      ? body.companionType.trim()
      : "owl";
  if (!isCompanionType(companionRaw)) {
    return { ok: false, code: "companion_invalid" };
  }

  const themeRaw =
    typeof body.designTheme === "string" ? body.designTheme : "simple";
  if (!isAllowedDiaryDesignThemeRaw(themeRaw)) {
    return { ok: false, code: "design_theme_invalid" };
  }
  const designTheme = normalizeDiaryDesignTheme(themeRaw.trim() || "simple");

  let contentFontMode = DEFAULT_CONTENT_FONT_MODE;
  if ("contentFontMode" in body && body.contentFontMode != null && body.contentFontMode !== "") {
    if (typeof body.contentFontMode !== "string" || !isContentFontMode(body.contentFontMode.trim())) {
      return { ok: false, code: "content_font_mode_invalid" };
    }
    contentFontMode = body.contentFontMode.trim();
  }

  const includeInBook =
    typeof body.includeInBook === "boolean" ? body.includeInBook : true;

  const hasPhotoDataUrl = Object.prototype.hasOwnProperty.call(body, "photoDataUrl");
  const photoRemoved = body.photoRemoved === true;
  if (photoRemoved && hasPhotoDataUrl) {
    return { ok: false, code: "photo_ambiguous" };
  }

  const request: CanonicalJournalSaveRequest = {
    saveOperationId,
    content,
    entryDate,
    profileId,
    mood: moodRaw,
    activity: activityRaw,
    companionType: companionRaw,
    designTheme,
    contentFontMode,
    includeInBook,
  };

  if (photoRemoved) {
    request.photoRemoved = true;
  } else if (hasPhotoDataUrl) {
    const raw = String(body.photoDataUrl ?? "").trim();
    if (!raw) return { ok: false, code: "photo_ambiguous" };
    if (raw.length > JOURNAL_PHOTO_DATA_URL_MAX_CHARS) {
      return { ok: false, code: "photo_too_large" };
    }
    request.photoDataUrl = raw;
  }

  const requestJson = stringifyCanonicalJournalSaveRequest(request);
  const requestByteLength = utf8ByteLength(requestJson);
  if (requestByteLength > REQUEST_JSON_MAX_BYTES) {
    return { ok: false, code: "payload_too_large" };
  }

  return {
    ok: true,
    request,
    requestJson,
    requestFingerprint: fingerprintCanonicalJournalSaveRequest(request),
    requestByteLength,
  };
}

export function parseStoredRequestJson(
  requestJson: string,
): CanonicalJournalSaveRequest | null {
  try {
    const parsed = JSON.parse(requestJson) as unknown;
    const recanon = canonicalizeExactJournalSavePayload({
      saveOperationId:
        typeof (parsed as { saveOperationId?: unknown })?.saveOperationId === "string"
          ? (parsed as { saveOperationId: string }).saveOperationId
          : "",
      payload: parsed,
    });
    if (!recanon.ok) return null;
    if (recanon.requestJson !== requestJson) return null;
    return recanon.request;
  } catch {
    return null;
  }
}
