import type { OrderPayload } from "@/lib/order/types";
import type { AppraisalCoreKey } from "./types";
import { buildCharmListReasonJa, buildListOverviewRowReasonJa } from "./stoneSelectionReasonJa";
import { getStonePdfV4EntryById } from "./stonePdfV4Master";

export interface StoneListOverviewRow {
  /** 一覧用の区分ラベル */
  segmentLabel: string;
  stoneName: string;
  number: number | null;
  keywordsDisplay: string;
  /** 一覧ページ用の自動生成文 */
  listReason: string;
}

const CORE_SEGMENT: Record<AppraisalCoreKey, string> = {
  lifePath: "ライフ・パス",
  destiny: "ディスティニー",
  soul: "ソウル",
  personality: "パーソナリティ",
  birthday: "バースデー",
};

/**
 * 鑑定書「一覧」ページ用の行。区分・石名・ナンバー・キーワード・選定理由。
 */
export function buildStoneListOverviewRows(order: OrderPayload): StoneListOverviewRow[] {
  const theme = order.stoneFocusTheme;

  const rows: StoneListOverviewRow[] = order.appraisalStones.items.map((item) => {
    const seg = CORE_SEGMENT[item.key];
    const kws = (item.keywords ?? []).filter(Boolean).join("・") || "—";

    const listReason = buildListOverviewRowReasonJa({
      key: item.key,
      focusThemeLabel: theme,
      focusThemeMatched: item.focusThemeMatched,
      stoneId: item.selected?.id ?? null,
      stoneNameJa: item.selected?.nameJa ?? null,
      number: item.number,
      color: item.color,
    });

    return {
      segmentLabel: seg,
      stoneName: item.selected?.nameJa ?? "（未選定）",
      number: item.number,
      keywordsDisplay: kws,
      listReason,
    };
  });

  const charm = order.stones.charmStone;
  const charmEntry = getStonePdfV4EntryById(charm.id);
  const charmKws =
    charmEntry != null
      ? [...new Set([...charmEntry.headlineKeywords, ...charmEntry.numerologyKeywords])].join("・") ||
        "—"
      : "—";

  rows.push({
    segmentLabel: "お守り石",
    stoneName: charm.nameJa,
    number: order.numerology.lifePathNumber,
    keywordsDisplay: charmKws,
    listReason: buildCharmListReasonJa(order),
  });

  return rows;
}
