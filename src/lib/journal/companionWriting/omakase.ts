import { companionTypes, type CompanionType } from "@/lib/journal/meta";

export const COMPANION_WRITING_OMAKASE_ID = "omakase" as const;

export type CompanionWritingChoiceId = CompanionType | typeof COMPANION_WRITING_OMAKASE_ID;

export function isOmakaseChoice(
  choice: CompanionWritingChoiceId,
): choice is typeof COMPANION_WRITING_OMAKASE_ID {
  return choice === COMPANION_WRITING_OMAKASE_ID;
}

export function pickOmakaseCompanion(): CompanionType {
  const index = Math.floor(Math.random() * companionTypes.length);
  return companionTypes[index]!;
}

export function resolveCompanionWritingChoice(
  choice: CompanionWritingChoiceId,
  omakaseResolved: CompanionType | null,
): CompanionType {
  if (isOmakaseChoice(choice)) {
    return omakaseResolved ?? pickOmakaseCompanion();
  }
  return choice;
}
