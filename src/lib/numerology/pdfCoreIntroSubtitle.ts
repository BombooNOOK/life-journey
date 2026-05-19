import type { OrderPayload } from "@/lib/order/types";
import { getBirthdayArticle } from "@/lib/numerology/birthdayData";
import { getDestinyArticle } from "@/lib/numerology/destinyData";
import { getLifePathArticle } from "@/lib/numerology/lifePathData";
import { getMaturityArticle } from "@/lib/numerology/maturityData";
import { getPersonalityArticle } from "@/lib/numerology/personalityData";
import { getSoulArticle } from "@/lib/numerology/soulData";
import type { CoreNumberIntroKey } from "@/lib/numerology/pdfCoreNumberIntroCopy";

/** 中間扉の固定ラベル（`core`）の直下に載せる、ナンバー別の見出し文言 */
export function getCoreNumberIntroSubtitle(
  key: CoreNumberIntroKey,
  order: OrderPayload,
  maturity: number | null | undefined,
): string | null {
  const { numerology } = order;
  switch (key) {
    case "lifePath":
      return getLifePathArticle(numerology.lifePathNumber ?? null)?.title ?? null;
    case "destiny":
      return getDestinyArticle(numerology.destinyNumber ?? null)?.title ?? null;
    case "soul":
      return getSoulArticle(numerology.soulNumber ?? null)?.title ?? null;
    case "personality":
      return getPersonalityArticle(numerology.personalityNumber ?? null)?.title ?? null;
    case "birthday":
      return getBirthdayArticle(numerology.birthdayNumber ?? null)?.strength ?? null;
    case "maturity":
      return getMaturityArticle(maturity ?? null)?.title ?? null;
    default:
      return null;
  }
}

/** バースデーのみ：中間扉に strength の下へ載せるテーマ行 */
export function getCoreNumberIntroThemeLine(
  key: CoreNumberIntroKey,
  order: OrderPayload,
): string | null {
  if (key !== "birthday") return null;
  return getBirthdayArticle(order.numerology.birthdayNumber ?? null)?.theme ?? null;
}
