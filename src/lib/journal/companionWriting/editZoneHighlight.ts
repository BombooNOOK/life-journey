import type { JournalCompanionHandoffFocus } from "@/lib/journal/companionWriting/session";

type Props = {
  kind: "photo" | "body";
  emphasized?: boolean;
  spotlight?: boolean;
  photoLabel: string;
  bodyLabel: string;
  photoSpotlightLabel: string;
  bodySpotlightLabel: string;
};

export function companionWritingZoneHintLabel({
  kind,
  emphasized = false,
  spotlight = false,
  photoLabel,
  bodyLabel,
  photoSpotlightLabel,
  bodySpotlightLabel,
}: Props): string {
  if (spotlight) {
    return kind === "photo" ? photoSpotlightLabel : bodySpotlightLabel;
  }
  return kind === "photo" ? photoLabel : bodyLabel;
}

export function isCompanionEditZoneActive(
  kind: JournalCompanionHandoffFocus,
  spotlightFocus: JournalCompanionHandoffFocus | null,
  activeFocus: JournalCompanionHandoffFocus | null,
  sessionEmphasis: JournalCompanionHandoffFocus | "both" | null | undefined,
): boolean {
  if (spotlightFocus === kind) return true;
  if (activeFocus === kind) return true;
  if (sessionEmphasis === kind) return true;
  return false;
}
