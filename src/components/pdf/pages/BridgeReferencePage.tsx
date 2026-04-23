import { View } from "@react-pdf/renderer";

import { PdfLongFormBody } from "../PdfLongFormBody";
import { PdfText as Text } from "../PdfText";
import { PdfPageFrame } from "../PdfPageFrame";

import {
  bridgeNumberMeaningsForReference,
  bridgePairTypeLabels,
  bridgeReferenceExtraSections,
  bridgeReferenceIntro,
  lifePathDestinyPairKeysSorted,
} from "@/lib/numerology/bridgeReferenceData";

import { pdfLongFormProseProps } from "../pdfLongFormSpacing";
import { pdfStyles } from "../styles";

/**
 * ブリッジ全タイプの参考（原稿は bridgeReferenceData から流し込み）。
 * 個別鑑定結果ページとは別ページ。
 */
export function BridgeReferencePage() {
  const meanings = bridgeNumberMeaningsForReference();
  const pairKeys = lifePathDestinyPairKeysSorted();

  return (
    <PdfPageFrame title="ブリッジ参考">
      <Text style={pdfStyles.h1}>{bridgeReferenceIntro.title}</Text>
      <PdfLongFormBody text={bridgeReferenceIntro.lead} marginTop={8} {...pdfLongFormProseProps} />

      <Text style={[pdfStyles.h2, { marginTop: 18 }]}>ブリッジの組み合わせ（10 種）</Text>
      <PdfLongFormBody text={bridgePairTypeLabels.join("\n\n")} marginTop={4} {...pdfLongFormProseProps} />

      <Text style={[pdfStyles.h2, { marginTop: 18 }]}>ブリッジナンバー 0〜8 の意味</Text>
      <PdfLongFormBody
        text={meanings.map((m) => `${m.number}：${m.text}`).join("\n\n")}
        marginTop={6}
        {...pdfLongFormProseProps}
      />

      <Text style={[pdfStyles.h2, { marginTop: 18 }]}>pairKey 一覧（全ブリッジペア共通）</Text>
      <Text style={[pdfStyles.muted, { marginTop: 4, marginBottom: 6 }]}>
        正規化後の 2 コアから作るキーです。LP×D 以外の組み合わせでも、同じキーなら同じ本文が使われます。
      </Text>
      <PdfLongFormBody text={pairKeys.join("、")} />

      {bridgeReferenceExtraSections.length > 0 ? (
        <>
          <Text style={[pdfStyles.h2, { marginTop: 18 }]}>追加参考</Text>
          {bridgeReferenceExtraSections.map((s) => (
            <View key={s.id} style={{ marginTop: 10 }} wrap={false}>
              <Text style={pdfStyles.sectionTitle}>{s.title}</Text>
              {s.body.trim() !== "" ? (
                <PdfLongFormBody text={s.body} marginTop={4} {...pdfLongFormProseProps} />
              ) : (
                <Text style={pdfStyles.muted}>（原稿は次段階で追加予定です）</Text>
              )}
            </View>
          ))}
        </>
      ) : null}
    </PdfPageFrame>
  );
}
