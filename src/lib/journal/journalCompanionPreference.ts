import {
  normalizeCompanionType,
  PHASE1_COMPANION_TYPE,
  type CompanionType,
} from "@/lib/journal/meta";

const STORAGE_KEY = "lj-journal-companion-preference:v1";

export function readJournalCompanionPreference(): CompanionType {
  if (typeof window === "undefined") return PHASE1_COMPANION_TYPE;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return normalizeCompanionType(raw);
  } catch {
    return PHASE1_COMPANION_TYPE;
  }
}

export function writeJournalCompanionPreference(companionType: CompanionType): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, companionType);
  } catch {
    /* ignore quota / private mode */
  }
}
