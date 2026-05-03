import { View } from "@react-pdf/renderer";

import { PdfText as Text } from "../PdfText";
import { PdfPageFrame } from "../PdfPageFrame";

import type { CustomerFormValues } from "@/lib/order/types";

import { PDF_CORE_RESULT_CONTINUATION_BACKGROUND_PATH } from "../pdfAssetPaths";
import { pdfStyles } from "../styles";

interface Props {
  customer: CustomerFormValues;
}

/**
 * 目次右列の数字は、ヘッダー右上の「現在 / 総数」と同じ基準（物理ページ番号から表紙を除いた読者向け番号）。
 * PDF のページ順を変えたらここも更新すること。
 */
export function CustomerPage({ customer }: Props) {
  const birthdayLabel = toSlashDateLabel(customer.birthDate);
  const headerTitle = `${customer.fullNameRomanDisplay} ${birthdayLabel}`;
  const tocItemSmall = { fontSize: 8.8, lineHeight: 1.35 } as const;
  const tocSectionSmall = { marginTop: 8, textAlign: "left" as const, fontSize: 10 } as const;
  const mt2 = { marginTop: 2 } as const;

  return (
    <PdfPageFrame title={headerTitle} firstPageBodyBackgroundSrc={PDF_CORE_RESULT_CONTINUATION_BACKGROUND_PATH}>
      <Text style={[pdfStyles.h1, { fontSize: 18, marginBottom: 8 }]}>目次</Text>
      <View style={{ marginTop: 2 }}>
        <Text style={[pdfStyles.softLead, tocItemSmall]}>・あなたのナンバー  …… 3</Text>
        <Text style={[pdfStyles.softLead, tocItemSmall, mt2]}>・はじめに  …… 4</Text>
        <Text style={[pdfStyles.softLead, tocItemSmall, mt2]}>・このガイドの案内人  …… 5</Text>
        <Text style={[pdfStyles.softLead, tocItemSmall, mt2]}>・数のキーワード  …… 6</Text>

        <Text style={[pdfStyles.sectionTitle, tocSectionSmall]}>第1章 今のあなたを知る</Text>
        <Text style={[pdfStyles.softLead, tocItemSmall, mt2]}>・ライフ・パス・ナンバー  …… 8</Text>
        <Text style={[pdfStyles.softLead, tocItemSmall, mt2]}>・ディスティニー・ナンバー  …… 16</Text>
        <Text style={[pdfStyles.softLead, tocItemSmall, mt2]}>・ソウル・ナンバー  …… 19</Text>
        <Text style={[pdfStyles.softLead, tocItemSmall, mt2]}>・パーソナリティ・ナンバー  …… 22</Text>
        <Text style={[pdfStyles.softLead, tocItemSmall, mt2]}>・バースデー・ナンバー  …… 25</Text>
        <Text style={[pdfStyles.softLead, tocItemSmall, mt2]}>・マチュリティ・ナンバー  …… 28</Text>
        <Text style={[pdfStyles.softLead, tocItemSmall, mt2]}>・フクロウ先生からのメッセージ  …… 31</Text>

        <Text style={[pdfStyles.sectionTitle, tocSectionSmall]}>第2章 これからの流れを知る</Text>
        <Text style={[pdfStyles.softLead, tocItemSmall, mt2]}>
          ・パーソナル・イヤー・ナンバー  …… 34
        </Text>
        <Text style={[pdfStyles.softLead, tocItemSmall, mt2]}>・フクロウ先生からのメッセージ  …… 45</Text>

        <Text style={[pdfStyles.sectionTitle, tocSectionSmall]}>第3章 心の中のズレを知る</Text>
        <Text style={[pdfStyles.softLead, tocItemSmall, mt2]}>・ブリッジ・ナンバー  …… 48</Text>
        <Text style={[pdfStyles.softLead, tocItemSmall, mt2]}>・フクロウ先生からのメッセージ  …… 64</Text>

        <Text style={[pdfStyles.sectionTitle, tocSectionSmall]}>第4章 あなたの言葉を残す</Text>
        <Text style={[pdfStyles.softLead, tocItemSmall, mt2]}>・この年大切にしたいこと  …… 82</Text>
        <Text style={[pdfStyles.softLead, tocItemSmall, mt2]}>・この年を振り返って  …… 83</Text>
        <Text style={[pdfStyles.softLead, tocItemSmall, mt2]}>・余白のページ  …… 84</Text>
        <Text style={[pdfStyles.softLead, tocItemSmall, mt2]}>・フクロウ先生からのメッセージ  …… 86</Text>
        <Text style={[pdfStyles.softLead, tocItemSmall, mt2]}>・今日から３か月の流れ  …… 87</Text>
        <Text style={[pdfStyles.softLead, tocItemSmall, mt2]}>・おわりに  …… 88</Text>
      </View>
    </PdfPageFrame>
  );
}

function toSlashDateLabel(iso: string): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  if (!m) return iso;
  const year = Number(m[1]);
  const month = Number(m[2]);
  const day = Number(m[3]);
  return `${year}/${month}/${day}`;
}
