import {
  calendarDayAccents,
  calendarMonthAccents,
  specialOverlapAccents,
} from "@/lib/diary-reading/calendarAccents";

import { calendarAccentDraftByCompanionPending } from "@/lib/journal/commentCalendarAccentDraftByCompanion.pending";
import { normalizeCompanionType, type CompanionType } from "@/lib/journal/meta";

const owlTextByAccentId = Object.fromEntries(
  [...calendarMonthAccents, ...calendarDayAccents, ...specialOverlapAccents].map((template) => [
    template.id,
    template.text,
  ]),
);

/**
 * アクセントテンプレ ID と伴走キャラに応じた末尾アクセント文を返す。
 * owl は本番原稿。他キャラは pending 原稿があればそれを使い、なければ owl にフォールバック。
 */
export function getCompanionAccentText(
  accentId: string,
  companionType: CompanionType | string,
  owlFallback?: string,
): string {
  const companion = normalizeCompanionType(companionType);
  if (companion !== "owl") {
    const override = calendarAccentDraftByCompanionPending[accentId]?.[companion];
    if (override?.trim()) return override;
  }
  return owlTextByAccentId[accentId] ?? owlFallback ?? "";
}
