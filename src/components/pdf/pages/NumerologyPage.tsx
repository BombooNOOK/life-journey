import { View } from "@react-pdf/renderer";

import { PdfText as Text } from "../PdfText";
import { PdfPageFrame } from "../PdfPageFrame";

import { maturityNumberFromNumerology } from "@/lib/numerology/reduce";
import type { NumerologyResult } from "@/lib/numerology/types";

import { pdfStyles } from "../styles";

interface Props {
  numerology: NumerologyResult;
}

function n(v: number | null | undefined): string {
  if (v == null) return "—";
  return String(v);
}

export function NumerologyPage({ numerology }: Props) {
  const { bridges } = numerology;
  const maturity = maturityNumberFromNumerology(numerology);
  const leftBridgeItems = [
    { label: "LP × D", value: n(bridges.lifePathDestiny) },
    { label: "LP × S", value: n(bridges.lifePathSoul) },
    { label: "LP × P", value: n(bridges.lifePathPersonality) },
    { label: "LP × BD", value: n(bridges.birthdayLifePath) },
    { label: "D × S", value: n(bridges.destinySoul) },
  ];
  const rightBridgeItems = [
    { label: "D × P", value: n(bridges.destinyPersonality) },
    { label: "D × BD", value: n(bridges.destinyBirthday) },
    { label: "S × P", value: n(bridges.soulPersonality) },
    { label: "S × BD", value: n(bridges.soulBirthday) },
    { label: "P × BD", value: n(bridges.personalityBirthday) },
  ];

  return (
    <PdfPageFrame title="コアナンバー・ブリッジナンバー">
      <Text style={pdfStyles.h1}>あなたのナンバー</Text>

      <View style={pdfStyles.coreTableSection}>
        <Text style={pdfStyles.coreTableTitle}>コアナンバー</Text>
        <Field label="ライフ・パス・ナンバー（LP）" value={n(numerology.lifePathNumber)} />
        <Field label="ディスティニー・ナンバー（D）" value={n(numerology.destinyNumber)} />
        <Field label="ソウル・ナンバー（S）" value={n(numerology.soulNumber)} />
        <Field label="パーソナリティ・ナンバー（P）" value={n(numerology.personalityNumber)} />
        <Field label="バースデー・ナンバー（BD）" value={n(numerology.birthdayNumber)} />
        <Field label="マチュリティ・ナンバー（M = LP + D）" value={n(maturity)} />
      </View>

      <View style={pdfStyles.coreTableSection}>
        <Text style={pdfStyles.coreTableTitle}>ブリッジ・ナンバー（10ペア）</Text>
        {leftBridgeItems.map((leftItem, index) => (
          <View key={leftItem.label} style={pdfStyles.coreBridgeTwoColRow}>
            <View style={pdfStyles.coreBridgeCell}>
              <Text style={pdfStyles.coreBridgeLabel}>{leftItem.label}</Text>
              <Text style={pdfStyles.coreBridgeValue}>{leftItem.value}</Text>
            </View>
            <View style={[pdfStyles.coreBridgeCell, pdfStyles.coreBridgeCellDivider]}>
              <Text style={pdfStyles.coreBridgeLabel}>{rightBridgeItems[index].label}</Text>
              <Text style={pdfStyles.coreBridgeValue}>{rightBridgeItems[index].value}</Text>
            </View>
          </View>
        ))}
      </View>
    </PdfPageFrame>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <View style={pdfStyles.coreTableRow}>
      <Text style={pdfStyles.coreTableLabel}>{label}</Text>
      <Text style={pdfStyles.coreTableValue}>{value}</Text>
    </View>
  );
}
