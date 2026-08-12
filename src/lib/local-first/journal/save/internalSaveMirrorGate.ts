/**
 * Internal-only gate for Phase 4B-4L save mirror wiring PoC.
 * Requires Capacitor native AND explicit build flag. No UID/email hardcoding.
 */

import { Capacitor } from "@capacitor/core";

/**
 * Explicit build flag (never commit .env.local). Example:
 * NEXT_PUBLIC_INTERNAL_JOURNAL_SAVE_MIRROR=1
 */
export function isInternalJournalSaveMirrorWiringEnabled(): boolean {
  return process.env.NEXT_PUBLIC_INTERNAL_JOURNAL_SAVE_MIRROR === "1";
}

/** Both native platform and explicit flag must be true. */
export function canRunInternalJournalSaveMirror(): boolean {
  return Capacitor.isNativePlatform() && isInternalJournalSaveMirrorWiringEnabled();
}
