import { baseComments } from "@/lib/diary-reading/baseComments";

import { personalDayActivityDraftByCompanionPending } from "@/lib/journal/commentPersonalDayActivityDraftByCompanion.pending";
import { normalizeCompanionType, type CompanionType } from "@/lib/journal/meta";

const owlTextByTemplateId = Object.fromEntries(
  baseComments.map((template) => [template.id, template.text]),
);

/** No.262 相当：ベース本文テンプレが見つからないときの owl 既定文 */
export const FALLBACK_BASE_TEMPLATE_ID = "fallback_no_base_match";

const FALLBACK_BASE_COMMENT =
  "今日の記録には、あなたにしか分からない小さな意味があります。書き残したことそのものが、明日の自分への手紙になります。";

/**
 * ベース本文テンプレ未一致時の伴走キャラ別フォールバック。
 */
export function getCompanionFallbackBaseCommentText(
  companionType: CompanionType | string,
): string {
  return getCompanionBaseCommentText(FALLBACK_BASE_TEMPLATE_ID, companionType);
}

/**
 * テンプレート ID と伴走キャラに応じたベース本文を返す。
 * owl は本番原稿。他キャラは pending 原稿があればそれを使い、なければ owl にフォールバック。
 */
export function getCompanionBaseCommentText(
  templateId: string,
  companionType: CompanionType | string,
): string {
  const companion = normalizeCompanionType(companionType);
  const pending = personalDayActivityDraftByCompanionPending[templateId];

  if (templateId === FALLBACK_BASE_TEMPLATE_ID) {
    if (companion !== "owl" && pending?.[companion]?.trim()) return pending[companion];
    return pending?.owl ?? FALLBACK_BASE_COMMENT;
  }

  if (companion !== "owl") {
    const override = pending?.[companion];
    if (override?.trim()) return override;
  }

  const owlText = owlTextByTemplateId[templateId];
  if (owlText) return owlText;

  return getCompanionFallbackBaseCommentText(companion);
}
