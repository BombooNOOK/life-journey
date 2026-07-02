export {
  clearCompanionWritingCalendarComplete,
  clearCompanionWritingEditSession,
  clearLegacyJournalCompanionHandoff,
  COMPANION_WRITING_CALENDAR_COMPLETE_KEY,
  COMPANION_WRITING_EDIT_SESSION_KEY,
  COMPANION_WRITING_FAREWELL_KEY,
  consumeCompanionWritingFarewell,
  JOURNAL_COMPANION_HANDOFF_STORAGE_KEY,
  prepareCompanionWritingEditNavigation,
  readCompanionWritingCalendarComplete,
  readCompanionWritingEditSession,
  readLegacyJournalCompanionHandoff,
  writeCompanionWritingCalendarComplete,
  writeCompanionWritingEditSession,
  writeCompanionWritingFarewell,
  type CompanionWritingCalendarCompletePayload,
  type CompanionWritingEditSession,
  type JournalCompanionHandoffFocus,
} from "./session";

/** @deprecated use prepareCompanionWritingEditNavigation */
export function prepareJournalCompanionHandoff(focus: "photo" | "body"): void {
  void focus;
}

/** @deprecated use prepareCompanionWritingEditNavigation */
export function buildJournalCompanionContinueHref(): string {
  return "/journal";
}
