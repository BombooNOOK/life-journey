import type { DecorationName } from "@/lib/decorations/catalog";
import type { CompanionType } from "@/lib/journal/meta";

import {
  COMPANION_WRITING_OMAKASE_ID,
  type CompanionWritingChoiceId,
} from "./omakase";

export const COMPANION_WRITING_APPRAISER_FACE: Record<CompanionType, DecorationName> = {
  owl: "character-owl-face",
  hedgehog: "character-hedgehog-face",
  sloth: "character-sloth-face",
  squirrel: "character-squirrel-face",
  frog: "character-kerosion-face",
};

export const COMPANION_WRITING_OMAKASE_FACE: DecorationName = "character-omakase-face";

export function companionWritingChoiceFace(choice: CompanionWritingChoiceId): DecorationName {
  if (choice === COMPANION_WRITING_OMAKASE_ID) {
    return COMPANION_WRITING_OMAKASE_FACE;
  }
  return COMPANION_WRITING_APPRAISER_FACE[choice];
}
