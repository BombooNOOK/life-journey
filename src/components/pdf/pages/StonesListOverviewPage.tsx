import { Page, View } from "@react-pdf/renderer";

import { PdfText as Text } from "../PdfText";

import type { OrderPayload } from "@/lib/order/types";
import { buildStoneListOverviewRows } from "@/lib/stones/stoneListOverview";
import { isNeutralStoneFocusTheme } from "@/lib/stones/stoneFocusTheme";

import { pdfStyles } from "../styles";

interface Props {
  order: OrderPayload;
}

/**
 * 原稿想定: 「あなたのカラーと守護石（49）」の次、「ライフ・パス・ナンバーの石（50）」の前に置く一覧。
 */
export function StonesListOverviewPage({ order }: Props) {
  const rows = buildStoneListOverviewRows(order);
  const intro = isNeutralStoneFocusTheme(order.stoneFocusTheme)
    ? "ナンバーと色で候補を絞り、各コアのルールで選定しています。"
    : `ナンバーと色で候補を絞ったうえで、関心テーマ「${order.stoneFocusTheme}」に近いキーワードを優先して並べ替えています（候補の集合は変えていません）。`;

  return (
    <Page size="A4" style={pdfStyles.page} wrap>
      <Text style={pdfStyles.h1}>守護石・お守り石 一覧</Text>
      <Text style={[pdfStyles.muted, { marginTop: 4, marginBottom: 4 }]}>{intro}</Text>
      <Text style={{ fontSize: 8, color: "#888", marginBottom: 12 }}>
        ※冊子原稿では「あなたのカラーと守護石（49）」の次、「ライフ・パス・ナンバーの石（50）」の前に置く想定です。
      </Text>

      {rows.map((row, i) => (
        <View key={i} style={[pdfStyles.box, { marginBottom: 10 }]}>
          <Text style={{ fontSize: 11 }}>区分: {row.segmentLabel}</Text>
          <Text style={{ fontSize: 11, marginTop: 6 }}>石名: {row.stoneName}</Text>
          <Text style={{ fontSize: 10, marginTop: 4, color: "#444" }}>
            対応ナンバー: {row.number ?? "—"}
          </Text>
          <Text style={{ fontSize: 10, marginTop: 4, color: "#333" }}>キーワード: {row.keywordsDisplay}</Text>
          <Text style={{ fontSize: 9, marginTop: 8, lineHeight: 1.55, color: "#333" }}>
            選定理由: {row.listReason}
          </Text>
        </View>
      ))}
    </Page>
  );
}
