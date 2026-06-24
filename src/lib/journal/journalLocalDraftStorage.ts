import {
  DEFAULT_CONTENT_FONT_MODE,
  normalizeContentFontMode,
  type ContentFontMode,
} from "@/lib/journal/contentFontMode";
import {
  isActivityId,
  isMoodId,
  PHASE1_COMPANION_TYPE,
  type ActivityId,
  type MoodId,
} from "@/lib/journal/meta";

export const JOURNAL_LOCAL_DRAFT_STORAGE_VERSION = 1 as const;
export const JOURNAL_LOCAL_DRAFT_KEY_PREFIX = "lj-journal-draft:v1:";

export type JournalLocalDraftPayload = {
  version: typeof JOURNAL_LOCAL_DRAFT_STORAGE_VERSION;
  savedAt: string;
  entryDate: string;
  mood: MoodId;
  activity: ActivityId;
  content: string;
  contentFontMode: ContentFontMode;
  companionType: typeof PHASE1_COMPANION_TYPE;
  editingId?: string;
};

export type JournalLocalDraftKeyParams = {
  email: string;
  profileId: string;
  mode: "new" | "edit";
  entryDateYmd?: string;
  editingId?: string;
};

function normalizeEmailForDraftKey(email: string): string {
  return email.trim().toLowerCase();
}

function normalizeProfileIdForDraftKey(profileId: string): string {
  const trimmed = profileId.trim();
  return trimmed || "_default";
}

export function buildJournalLocalDraftKey(params: JournalLocalDraftKeyParams): string | null {
  const email = normalizeEmailForDraftKey(params.email);
  if (!email) return null;

  const profileId = normalizeProfileIdForDraftKey(params.profileId);

  if (params.mode === "edit") {
    const editingId = params.editingId?.trim();
    if (!editingId) return null;
    return `${JOURNAL_LOCAL_DRAFT_KEY_PREFIX}${email}:${profileId}:edit:${editingId}`;
  }

  const entryDateYmd = params.entryDateYmd?.trim();
  if (!entryDateYmd || !/^\d{4}-\d{2}-\d{2}$/.test(entryDateYmd)) return null;
  return `${JOURNAL_LOCAL_DRAFT_KEY_PREFIX}${email}:${profileId}:new:${entryDateYmd}`;
}

export function isValidJournalLocalDraftEntryDate(value: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(value.trim());
}

export function parseJournalLocalDraftPayload(raw: string): JournalLocalDraftPayload | null {
  try {
    const parsed = JSON.parse(raw) as Partial<JournalLocalDraftPayload>;
    if (parsed.version !== JOURNAL_LOCAL_DRAFT_STORAGE_VERSION) return null;
    if (typeof parsed.savedAt !== "string" || !parsed.savedAt.trim()) return null;
    if (typeof parsed.entryDate !== "string" || !isValidJournalLocalDraftEntryDate(parsed.entryDate)) {
      return null;
    }
    if (typeof parsed.content !== "string") return null;
    if (!isMoodId(String(parsed.mood))) return null;
    if (!isActivityId(String(parsed.activity))) return null;

    return {
      version: JOURNAL_LOCAL_DRAFT_STORAGE_VERSION,
      savedAt: parsed.savedAt,
      entryDate: parsed.entryDate.trim(),
      mood: parsed.mood as MoodId,
      activity: parsed.activity as ActivityId,
      content: parsed.content,
      contentFontMode: normalizeContentFontMode(parsed.contentFontMode),
      companionType: PHASE1_COMPANION_TYPE,
      editingId:
        typeof parsed.editingId === "string" && parsed.editingId.trim()
          ? parsed.editingId.trim()
          : undefined,
    };
  } catch {
    return null;
  }
}

export function readJournalLocalDraft(key: string): JournalLocalDraftPayload | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return null;
    return parseJournalLocalDraftPayload(raw);
  } catch {
    return null;
  }
}

export function writeJournalLocalDraft(
  key: string,
  payload: JournalLocalDraftPayload,
): boolean {
  if (typeof window === "undefined") return false;
  try {
    window.localStorage.setItem(key, JSON.stringify(payload));
    return true;
  } catch {
    return false;
  }
}

export function clearJournalLocalDraft(key: string): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(key);
  } catch {
    /* quota / private mode */
  }
}

export type JournalLocalDraftFormSnapshot = {
  entryDate: string;
  mood: MoodId;
  activity: ActivityId;
  content: string;
  contentFontMode: ContentFontMode;
};

export function buildJournalLocalDraftPayload(
  snapshot: JournalLocalDraftFormSnapshot,
  options?: { editingId?: string | null },
): JournalLocalDraftPayload {
  return {
    version: JOURNAL_LOCAL_DRAFT_STORAGE_VERSION,
    savedAt: new Date().toISOString(),
    entryDate: snapshot.entryDate.trim(),
    mood: snapshot.mood,
    activity: snapshot.activity,
    content: snapshot.content,
    contentFontMode: snapshot.contentFontMode,
    companionType: PHASE1_COMPANION_TYPE,
    editingId: options?.editingId?.trim() || undefined,
  };
}

/** 空の新規フォーム相当なら端末下書きとして意味がない */
export function isMeaningfulNewJournalLocalDraft(
  payload: JournalLocalDraftPayload,
  defaultEntryDate: string,
): boolean {
  if (payload.content.trim()) return true;
  if (payload.entryDate !== defaultEntryDate) return true;
  if (payload.mood !== "calm") return true;
  if (payload.activity !== "record_anyway") return true;
  if (payload.contentFontMode !== DEFAULT_CONTENT_FONT_MODE) return true;
  return false;
}

export function journalLocalDraftDiffersFromSnapshot(
  payload: JournalLocalDraftPayload,
  snapshot: JournalLocalDraftFormSnapshot,
): boolean {
  return (
    payload.entryDate !== snapshot.entryDate.trim() ||
    payload.mood !== snapshot.mood ||
    payload.activity !== snapshot.activity ||
    payload.content !== snapshot.content ||
    payload.contentFontMode !== snapshot.contentFontMode
  );
}

export function snapshotsEqual(
  a: JournalLocalDraftFormSnapshot,
  b: JournalLocalDraftFormSnapshot,
): boolean {
  return (
    a.entryDate === b.entryDate &&
    a.mood === b.mood &&
    a.activity === b.activity &&
    a.content === b.content &&
    a.contentFontMode === b.contentFontMode
  );
}
