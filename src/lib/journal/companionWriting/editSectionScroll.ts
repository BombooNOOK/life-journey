import type { JournalCompanionHandoffFocus } from "@/lib/journal/companionWriting/session";

export const JOURNAL_PHOTO_SECTION_ID = "journal-photo-section";
export const JOURNAL_BODY_SECTION_ID = "journal-body-section";

/** sticky ヘッダー分の余白 */
const JOURNAL_EDIT_SECTION_SCROLL_OFFSET_PX = 64;

export function journalEditFocusSectionId(focus: JournalCompanionHandoffFocus): string {
  return focus === "photo" ? JOURNAL_PHOTO_SECTION_ID : JOURNAL_BODY_SECTION_ID;
}

export function scrollJournalEditSectionIntoView(
  focus: JournalCompanionHandoffFocus,
  opts?: { behavior?: ScrollBehavior },
) {
  const target = document.getElementById(journalEditFocusSectionId(focus));
  if (!target) return;

  const alignTop = () => {
    const top =
      target.getBoundingClientRect().top +
      window.scrollY -
      JOURNAL_EDIT_SECTION_SCROLL_OFFSET_PX;
    window.scrollTo({
      top: Math.max(0, top),
      behavior: opts?.behavior ?? "smooth",
    });
  };

  alignTop();
  window.requestAnimationFrame(alignTop);
  window.setTimeout(alignTop, 200);
}
