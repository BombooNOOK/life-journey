import type { JournalSocialPostTemplateId } from "./templates";
import {
  DEFAULT_JOURNAL_SOCIAL_POST_PHOTO_ADJUST,
  normalizeJournalSocialPostPhotoAdjust,
  type JournalSocialPostPhotoAdjust,
} from "./photoAdjust";

const STORAGE_KEY_PREFIX = "lj-journal-sns-photo-adjust:v1";

export function journalSocialPostPhotoAdjustStorageKey(
  entryId: string,
  templateId: JournalSocialPostTemplateId,
): string {
  return `${STORAGE_KEY_PREFIX}:${entryId.trim()}:${templateId}`;
}

export function readJournalSocialPostPhotoAdjustFromStorage(
  entryId: string,
  templateId: JournalSocialPostTemplateId,
): JournalSocialPostPhotoAdjust | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(
      journalSocialPostPhotoAdjustStorageKey(entryId, templateId),
    );
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<JournalSocialPostPhotoAdjust>;
    return normalizeJournalSocialPostPhotoAdjust(parsed);
  } catch {
    return null;
  }
}

export function writeJournalSocialPostPhotoAdjustToStorage(
  entryId: string,
  templateId: JournalSocialPostTemplateId,
  adjust: JournalSocialPostPhotoAdjust,
): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(
      journalSocialPostPhotoAdjustStorageKey(entryId, templateId),
      JSON.stringify(normalizeJournalSocialPostPhotoAdjust(adjust)),
    );
  } catch {
    /* quota / private mode */
  }
}

export function clearJournalSocialPostPhotoAdjustFromStorage(
  entryId: string,
  templateId: JournalSocialPostTemplateId,
): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(journalSocialPostPhotoAdjustStorageKey(entryId, templateId));
  } catch {
    /* ignore */
  }
}

export function getDefaultOrStoredPhotoAdjust(
  entryId: string,
  templateId: JournalSocialPostTemplateId,
): JournalSocialPostPhotoAdjust {
  return (
    readJournalSocialPostPhotoAdjustFromStorage(entryId, templateId) ??
    DEFAULT_JOURNAL_SOCIAL_POST_PHOTO_ADJUST
  );
}
