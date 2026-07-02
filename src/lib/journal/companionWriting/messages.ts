import { companionOptions, type CompanionType } from "@/lib/journal/meta";

/** 鑑定士ラベル（表示用） */
export function getAppraiserDisplayName(companionType: CompanionType): string {
  return companionOptions.find((c) => c.id === companionType)?.label ?? "フクロウ先生";
}
