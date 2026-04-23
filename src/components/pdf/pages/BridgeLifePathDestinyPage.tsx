import { Image, View } from "@react-pdf/renderer";

import { PdfLongFormBody } from "../PdfLongFormBody";
import { PdfText as Text } from "../PdfText";
import { PdfPageFrame } from "../PdfPageFrame";

import { bridgeAgreementPdfParts } from "@/lib/numerology/lifePathDestinyBridge";
import { type PdfBridgeBlock, buildPdfBridgeBlocks } from "@/lib/numerology/pdfBridgeBlocks";
import type { NumerologyResult } from "@/lib/numerology/types";

import { pdfLongFormProseProps } from "../pdfLongFormSpacing";
import type { BodyRenderOverrides } from "../pdfRenderConfig";
import {
  PDF_BRIDGE_STAR_1_PATH,
  PDF_BRIDGE_STAR_2_PATH,
  PDF_BRIDGE_STAR_3_PATH,
  PDF_BRIDGE_STAR_4_PATH,
  PDF_BRIDGE_STAR_5_PATH,
} from "../pdfAssetPaths";
import { pdfStyles } from "../styles";

const MSG_SCORE_PLANNED =
  "一致度・個別解説は次段階で追加予定です。（ブリッジナンバーは下記のとおりです）";

const MSG_BODY_PLANNED = "このブリッジの個別解説は次段階で追加予定です。";

function bridgeStarImagePath(filledOf5: number): string {
  const n = Math.max(1, Math.min(5, Math.floor(filledOf5)));
  const byCount: Record<number, string> = {
    1: PDF_BRIDGE_STAR_1_PATH,
    2: PDF_BRIDGE_STAR_2_PATH,
    3: PDF_BRIDGE_STAR_3_PATH,
    4: PDF_BRIDGE_STAR_4_PATH,
    5: PDF_BRIDGE_STAR_5_PATH,
  };
  return byCount[n];
}

function BridgePdfBlockSection({
  block,
  bodyStyle,
  bodyExpandWidth,
}: { block: PdfBridgeBlock } & BodyRenderOverrides) {
  const hasScore = block.scorePercent != null;
  const agreementParts = hasScore ? bridgeAgreementPdfParts(block.scorePercent!) : null;
  const bridgeKnown = block.bridgeNumber != null;
  const introLead = block.intro.lead.replace(/^[’'→\s]+/, "");

  return (
    <View style={{ marginTop: 18 }}>
      <Text style={pdfStyles.resultTitle}>{block.intro.title}</Text>
      <Text style={[pdfStyles.softLead, { marginTop: 2, textAlign: "center" }]}>{introLead}</Text>
      <PdfLongFormBody
        text={block.intro.article}
        marginTop={6}
        {...pdfLongFormProseProps}
        bodyStyle={bodyStyle}
        expandWidth={bodyExpandWidth}
      />

      {/* 前ページから続く導入本文と、ブリッジ番号上の区切り線のあいだに約2行分の余白 */}
      <View style={[pdfStyles.subtleDivider, { marginTop: 36 }]} />
      <Text style={[pdfStyles.sectionTitle, { marginTop: 2 }]}>
        {bridgeKnown
          ? `あなたのブリッジナンバーは ${block.bridgeNumber} です。`
          : "必要なコアナンバーが不足しているため、この組み合わせのブリッジナンバーは算出できません。"}
      </Text>
      <View style={{ marginTop: 4 }}>
        {block.contextLines.map((line) => (
          <Text key={line.label} style={[pdfStyles.sectionBody, { textAlign: "center" }]}>
            {line.label}：{line.value}
          </Text>
        ))}
      </View>

      {hasScore && agreementParts ? (
        <View style={{ marginTop: 12 }}>
          <View style={pdfStyles.subtleDivider} />
          <Text style={[pdfStyles.sectionTitle, { marginTop: 2 }]}>一致度</Text>
          <View style={pdfStyles.bridgeAgreementRow}>
            <View style={pdfStyles.bridgeAgreementStarsCol}>
              <Image
                cache={false}
                src={bridgeStarImagePath(agreementParts.filledOf5)}
                style={{ width: 118, height: 28 }}
              />
            </View>
            <View style={pdfStyles.bridgeAgreementPercentCol}>
              <Text style={pdfStyles.bridgeAgreementPercentText}>
                {agreementParts.percentShown}%
              </Text>
            </View>
          </View>
          {block.scoreLabel != null && block.scoreLabel !== "" ? (
            <PdfLongFormBody
              text={block.scoreLabel}
              marginTop={2}
              {...pdfLongFormProseProps}
              bodyStyle={bodyStyle ? { ...bodyStyle, textAlign: "center" } : { textAlign: "center" }}
              expandWidth={bodyExpandWidth}
            />
          ) : null}
        </View>
      ) : !hasScore ? (
        <Text style={[pdfStyles.muted, { marginTop: 8 }]}>{MSG_SCORE_PLANNED}</Text>
      ) : null}

      {bridgeKnown ? (
        <View>
          <Text break style={[pdfStyles.sectionTitle, { marginTop: 12 }]}>
            【ブリッジ・ナンバー {block.bridgeNumber} を持つあなたへ】
          </Text>
          {block.article != null && block.article.trim() !== "" ? (
            <PdfLongFormBody
              text={block.article}
              marginTop={8}
              {...pdfLongFormProseProps}
              bodyStyle={bodyStyle}
              expandWidth={bodyExpandWidth}
            />
          ) : (
            <Text style={[pdfStyles.muted, { marginTop: 8 }]}>{MSG_BODY_PLANNED}</Text>
          )}
        </View>
      ) : (
        <Text style={[pdfStyles.muted, { marginTop: 8 }]}>
          コアナンバーを入力すると、ここにブリッジの解説を表示できます。
        </Text>
      )}
    </View>
  );
}

interface BridgesPdfPageProps {
  blocks: PdfBridgeBlock[];
}

/** ブリッジを複数件まとめて表示（配列で拡張） */
export function BridgesPdfPage({
  blocks,
  bodyStyle,
  bodyExpandWidth,
}: BridgesPdfPageProps & BodyRenderOverrides) {
  const lpDestinyBlock = blocks.find((b) => b.id === "lifePathDestiny");
  const lpDestinyUnavailable = lpDestinyBlock != null && lpDestinyBlock.bridgeNumber == null;

  return (
    <PdfPageFrame title="ブリッジナンバー" pageType="body" showHeader={true}>
      {lpDestinyUnavailable ? (
        <Text style={[pdfStyles.muted, { marginTop: 16 }]}>
          ローマ字名が空、またはディスティニーが算出できない場合、LP×D
          以外にも名前由来のナンバーが必要なブリッジは「算出できません」と表示されます。
        </Text>
      ) : null}

      {blocks.map((block, idx) => (
        <View key={block.id} break={idx > 0}>
          <BridgePdfBlockSection block={block} bodyStyle={bodyStyle} bodyExpandWidth={bodyExpandWidth} />
        </View>
      ))}
    </PdfPageFrame>
  );
}

interface LegacyProps {
  numerology: NumerologyResult;
}

/** 互換用。内部は `buildPdfBridgeBlocks` → `BridgesPdfPage` */
export function BridgeLifePathDestinyPage({ numerology }: LegacyProps) {
  return <BridgesPdfPage blocks={buildPdfBridgeBlocks(numerology)} />;
}
