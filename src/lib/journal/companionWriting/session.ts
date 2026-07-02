import {
  journalCalendarAfterCompanionSavePath,
  journalEditContinuePath,
} from "@/lib/journal/journalNav";
import type { CompanionType } from "@/lib/journal/meta";
import { normalizeCompanionType } from "@/lib/journal/meta";

export const COMPANION_WRITING_CALENDAR_COMPLETE_KEY =
  "lj-cw-calendar-complete:v1";

export const COMPANION_WRITING_EDIT_SESSION_KEY = "lj-cw-edit-session:v1";

export const COMPANION_WRITING_FAREWELL_KEY = "lj-cw-farewell:v1";

/** @deprecated v1 scroll-only handoff — use edit session + focus query */
export const JOURNAL_COMPANION_HANDOFF_STORAGE_KEY = "lj-journal-companion-handoff:v1";

export type JournalCompanionHandoffFocus = "photo" | "body";

export type CompanionWritingCalendarCompletePayload = {
  version: 1;
  entryId: string;
  entryDateYmd: string;
  companionType: CompanionType;
  profileId?: string;
  designTheme?: string;
};

export type CompanionWritingEditSession = {
  version: 1;
  entryId: string;
  entryDateYmd: string;
  companionType: CompanionType;
  /** 案内カードの強調（両方表示しつつ、どちらを目立たせるか） */
  emphasis: JournalCompanionHandoffFocus | "both";
  profileId?: string;
};

function readJson<T>(key: string): T | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.sessionStorage.getItem(key);
    if (!raw) return null;
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

function writeJson(key: string, value: unknown): void {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* ignore */
  }
}

function removeKey(key: string): void {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.removeItem(key);
  } catch {
    /* ignore */
  }
}

export function writeCompanionWritingCalendarComplete(
  payload: CompanionWritingCalendarCompletePayload,
): void {
  writeJson(COMPANION_WRITING_CALENDAR_COMPLETE_KEY, payload);
}

export function readCompanionWritingCalendarComplete(): CompanionWritingCalendarCompletePayload | null {
  const parsed = readJson<CompanionWritingCalendarCompletePayload>(
    COMPANION_WRITING_CALENDAR_COMPLETE_KEY,
  );
  if (parsed?.version !== 1 || !parsed.entryId?.trim() || !parsed.entryDateYmd?.trim()) {
    return null;
  }
  return {
    ...parsed,
    companionType: normalizeCompanionType(parsed.companionType),
  };
}

export function clearCompanionWritingCalendarComplete(): void {
  removeKey(COMPANION_WRITING_CALENDAR_COMPLETE_KEY);
}

export function writeCompanionWritingEditSession(
  payload: CompanionWritingEditSession,
): void {
  writeJson(COMPANION_WRITING_EDIT_SESSION_KEY, payload);
}

export function readCompanionWritingEditSession(): CompanionWritingEditSession | null {
  const parsed = readJson<CompanionWritingEditSession>(COMPANION_WRITING_EDIT_SESSION_KEY);
  if (parsed?.version !== 1 || !parsed.entryId?.trim() || !parsed.entryDateYmd?.trim()) {
    return null;
  }
  return {
    ...parsed,
    companionType: normalizeCompanionType(parsed.companionType),
  };
}

export function clearCompanionWritingEditSession(): void {
  removeKey(COMPANION_WRITING_EDIT_SESSION_KEY);
}

export function writeCompanionWritingFarewell(): void {
  writeJson(COMPANION_WRITING_FAREWELL_KEY, { version: 1, at: Date.now() });
}

export function consumeCompanionWritingFarewell(): boolean {
  const parsed = readJson<{ version: number }>(COMPANION_WRITING_FAREWELL_KEY);
  if (parsed?.version !== 1) return false;
  removeKey(COMPANION_WRITING_FAREWELL_KEY);
  return true;
}

export function prepareCompanionWritingEditNavigation(params: {
  entryId: string;
  entryDateYmd: string;
  companionType: CompanionType;
  focus: JournalCompanionHandoffFocus;
  emphasis?: JournalCompanionHandoffFocus | "both";
  profileId?: string;
}): string {
  const emphasis = params.emphasis ?? params.focus;
  writeCompanionWritingEditSession({
    version: 1,
    entryId: params.entryId,
    entryDateYmd: params.entryDateYmd,
    companionType: params.companionType,
    emphasis,
    profileId: params.profileId,
  });
  return journalEditContinuePath({
    entryId: params.entryId,
    focus: params.focus,
    profileId: params.profileId,
    returnTo: journalCalendarAfterCompanionSavePath({
      entryDateYmd: params.entryDateYmd,
      profileId: params.profileId,
    }),
  });
}

/** 完了カード「育てる」→ 編集画面で写真・本文の両方を案内 */
export function prepareCompanionWritingGrowNavigation(params: {
  entryId: string;
  entryDateYmd: string;
  companionType: CompanionType;
  profileId?: string;
}): string {
  return prepareCompanionWritingEditNavigation({
    ...params,
    focus: "body",
    emphasis: "both",
  });
}

/** v1 互換：スクロール用 handoff の読み取り */
export function readLegacyJournalCompanionHandoff(): {
  focus: JournalCompanionHandoffFocus;
} | null {
  const parsed = readJson<{ version: number; focus?: string }>(
    JOURNAL_COMPANION_HANDOFF_STORAGE_KEY,
  );
  if (parsed?.version !== 1) return null;
  if (parsed.focus !== "photo" && parsed.focus !== "body") return null;
  return { focus: parsed.focus };
}

export function clearLegacyJournalCompanionHandoff(): void {
  removeKey(JOURNAL_COMPANION_HANDOFF_STORAGE_KEY);
}
