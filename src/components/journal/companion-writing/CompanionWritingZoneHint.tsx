import {
  COMPANION_WRITING_ZONE_BODY_LABEL,
  COMPANION_WRITING_ZONE_PHOTO_LABEL,
} from "@/lib/journal/companionWriting/types";

import { companionWritingZoneHintClass } from "./companionWritingGuideStyles";

type Props = {
  kind: "photo" | "body";
  emphasized?: boolean;
};

export function CompanionWritingZoneHint({ kind, emphasized = false }: Props) {
  const label =
    kind === "photo" ? COMPANION_WRITING_ZONE_PHOTO_LABEL : COMPANION_WRITING_ZONE_BODY_LABEL;

  return (
    <p className={companionWritingZoneHintClass(emphasized)} role="note">
      <span
        aria-hidden
        className={[
          "inline-block h-1.5 w-1.5 shrink-0 rounded-full",
          emphasized ? "bg-emerald-500" : "bg-stone-400",
        ].join(" ")}
      />
      {label}
    </p>
  );
}
