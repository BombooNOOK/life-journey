"use client";

import {
  COMPANION_WRITING_ZONE_BODY_LABEL,
  COMPANION_WRITING_ZONE_BODY_SPOTLIGHT_LABEL,
  COMPANION_WRITING_ZONE_PHOTO_LABEL,
  COMPANION_WRITING_ZONE_PHOTO_SPOTLIGHT_LABEL,
} from "@/lib/journal/companionWriting/types";
import { companionWritingZoneHintLabel } from "@/lib/journal/companionWriting/editZoneHighlight";

import { companionWritingZoneHintClass } from "./companionWritingGuideStyles";

type Props = {
  kind: "photo" | "body";
  emphasized?: boolean;
  spotlight?: boolean;
};

export function CompanionWritingZoneHint({ kind, emphasized = false, spotlight = false }: Props) {
  const label = companionWritingZoneHintLabel({
    kind,
    emphasized,
    spotlight,
    photoLabel: COMPANION_WRITING_ZONE_PHOTO_LABEL,
    bodyLabel: COMPANION_WRITING_ZONE_BODY_LABEL,
    photoSpotlightLabel: COMPANION_WRITING_ZONE_PHOTO_SPOTLIGHT_LABEL,
    bodySpotlightLabel: COMPANION_WRITING_ZONE_BODY_SPOTLIGHT_LABEL,
  });

  return (
    <p className={companionWritingZoneHintClass(emphasized, spotlight)} role="note">
      <span
        aria-hidden
        className={[
          "inline-block shrink-0 rounded-full",
          spotlight ? "h-2 w-2 bg-emerald-500" : "h-1.5 w-1.5",
          emphasized || spotlight ? "bg-emerald-500" : "bg-stone-400",
        ].join(" ")}
      />
      {label}
    </p>
  );
}
