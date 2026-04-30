import type { OrderPayload } from "@/lib/order/types";
import { maturityNumberFromNumerology } from "@/lib/numerology/reduce";
import { buildPdfBridgeBlocks } from "@/lib/numerology/pdfBridgeBlocks";

import { AfterwordPages } from "./pages/AfterwordPages";
import { BirthdayGuidePage } from "./pages/BirthdayGuidePage";
import { BirthdayPage } from "./pages/BirthdayPage";
import { BridgesPdfPage } from "./pages/BridgeLifePathDestinyPage";
import { BridgeReferencePage } from "./pages/BridgeReferencePage";
import { CoverPage } from "./pages/CoverPage";
import { Chapter1DividerPage } from "./pages/Chapter1DividerPage";
import { Chapter2DividerPage } from "./pages/Chapter2DividerPage";
import { Chapter3DividerPage } from "./pages/Chapter3DividerPage";
import { InsideCoverPage } from "./pages/InsideCoverPage";
import { CustomerPage } from "./pages/CustomerPage";
import { DestinyGuidePage } from "./pages/DestinyGuidePage";
import { DestinyPage } from "./pages/DestinyPage";
import { IntroductionPages } from "./pages/IntroductionPages";
import { LifePathGuidePage } from "./pages/LifePathGuidePage";
import { LifePathPage } from "./pages/LifePathPage";
import {
  JournalInviteLeadPage,
  JournalInvitePagesFromChapter4Divider,
} from "./pages/JournalInvitePages";
import { MaturityGuidePage } from "./pages/MaturityGuidePage";
import { MaturityPage } from "./pages/MaturityPage";
import { NumerologyPage } from "./pages/NumerologyPage";
import { NumberKeywordsPage } from "./pages/NumberKeywordsPage";
import { PersonalYearDetailPages } from "./pages/PersonalYearDetailPages";
import { PersonalMonthBonusPage } from "./pages/PersonalMonthBonusPage";
import { PersonalMonthIntroExtraPage } from "./pages/PersonalMonthIntroExtraPage";
import { PersonalYearGuidePage, PersonalYearMessagePage } from "./pages/PersonalYearIntroPages";
import { PersonalYearOverviewPage } from "./pages/PersonalYearOverviewPage";
import { PersonalityGuidePage } from "./pages/PersonalityGuidePage";
import { PersonalityPage } from "./pages/PersonalityPage";
import { SoulGuidePage } from "./pages/SoulGuidePage";
import { SoulPage } from "./pages/SoulPage";
import { BridgeIntroPages } from "./pages/BridgeIntroPages";
import { BridgeSectionCoverPage } from "./pages/BridgeSectionCoverPage";
import { PdfQualityProvider } from "./pdfQualityContext";
import { bodyStyleFromConfig, type PdfRenderConfig } from "./pdfRenderConfig";

/** ブリッジ参考（全タイプ一覧）は内容が長く複数ページになるため、現行の鑑定 PDF では出さない */
const INCLUDE_BRIDGE_REFERENCE_IN_REPORT_PDF = false;

export type ReportPdfPageSegment =
  /** パーソナルイヤー導入のフクロウ先生ページまで（ここに blank01 を挟む） */
  | "beforeChapter3Insert"
  /** 第2章扉〜第3章直前メッセージまで（ここに blank02 を挟む） */
  | "chapter3ThroughJournalInviteLead"
  /** 第3章扉以降〜末尾 */
  | "fromChapter4DividerOnward"
  /** 挿入なしの一括（プレビュー・部分フォーカス以外） */
  | "full";

interface Props {
  order: OrderPayload;
  renderConfig?: PdfRenderConfig;
  segment: ReportPdfPageSegment;
}

export function ReportPdfPages({ order, renderConfig, segment }: Props) {
  const maturity = maturityNumberFromNumerology(order.numerology);
  const bridgeBlocks = buildPdfBridgeBlocks(order.numerology);
  const personalYearReferenceDate = new Date();
  const purchaseDate = order.purchaseDateIso ? new Date(order.purchaseDateIso) : new Date();
  const focus = renderConfig?.focusPage ?? "all";
  const showAll = focus === "all";
  const bodyStyle = renderConfig ? bodyStyleFromConfig(renderConfig) : undefined;
  const bodyExpandWidth = renderConfig?.bodyExpandWidth;
  const quality = renderConfig?.quality ?? "high";
  const includeDecorativePages = quality === "high";
  const bridgeChunkSize = 2;
  const bridgeChunks = [];
  for (let i = 0; i < bridgeBlocks.length; i += bridgeChunkSize) {
    bridgeChunks.push(bridgeBlocks.slice(i, i + bridgeChunkSize));
  }

  const beforeChapter3Insert = (
    <>
      {showAll && includeDecorativePages ? <CoverPage /> : null}
      {showAll && includeDecorativePages ? <InsideCoverPage /> : null}
      {showAll ? <CustomerPage customer={order} /> : null}
      {showAll ? <NumerologyPage numerology={order.numerology} /> : null}
      {showAll && includeDecorativePages ? <IntroductionPages /> : null}
      {showAll && includeDecorativePages ? <NumberKeywordsPage /> : null}
      {showAll && includeDecorativePages ? <Chapter1DividerPage /> : null}
      {showAll || (focus === "lifePath" && includeDecorativePages) ? <LifePathGuidePage /> : null}
      {showAll || focus === "lifePath" ? (
        <LifePathPage
          lifePath={order.numerology.lifePathNumber}
          bodyStyle={bodyStyle}
          bodyExpandWidth={bodyExpandWidth}
        />
      ) : null}
      {showAll && includeDecorativePages ? <DestinyGuidePage /> : null}
      {showAll ? (
        <DestinyPage
          destiny={order.numerology.destinyNumber}
          bodyStyle={bodyStyle}
          bodyExpandWidth={bodyExpandWidth}
        />
      ) : null}
      {showAll && includeDecorativePages ? <SoulGuidePage /> : null}
      {showAll ? (
        <SoulPage soul={order.numerology.soulNumber} bodyStyle={bodyStyle} bodyExpandWidth={bodyExpandWidth} />
      ) : null}
      {showAll && includeDecorativePages ? <PersonalityGuidePage /> : null}
      {showAll ? (
        <PersonalityPage
          personality={order.numerology.personalityNumber}
          bodyStyle={bodyStyle}
          bodyExpandWidth={bodyExpandWidth}
        />
      ) : null}
      {showAll && includeDecorativePages ? <BirthdayGuidePage /> : null}
      {showAll ? (
        <BirthdayPage
          birthday={order.numerology.birthdayNumber}
          bodyStyle={bodyStyle}
          bodyExpandWidth={bodyExpandWidth}
        />
      ) : null}
      {showAll && includeDecorativePages ? <MaturityGuidePage /> : null}
      {showAll ? (
        <MaturityPage maturity={maturity} bodyStyle={bodyStyle} bodyExpandWidth={bodyExpandWidth} />
      ) : null}
      {showAll && includeDecorativePages ? <PersonalYearMessagePage /> : null}
    </>
  );

  const chapter3ThroughJournalInviteLead = (
    <>
      {showAll && includeDecorativePages ? <Chapter2DividerPage /> : null}
      {showAll && includeDecorativePages ? <PersonalYearGuidePage /> : null}
      {showAll || focus === "personalYear" ? (
        <PersonalYearOverviewPage
          birthMonth={order.birthMonth}
          birthDay={order.birthDay}
          referenceDate={personalYearReferenceDate}
          bodyStyle={bodyStyle}
          bodyExpandWidth={bodyExpandWidth}
        />
      ) : null}
      {showAll || focus === "personalYear" ? (
        <PersonalYearDetailPages
          birthMonth={order.birthMonth}
          birthDay={order.birthDay}
          referenceDate={personalYearReferenceDate}
          bodyStyle={bodyStyle}
          bodyExpandWidth={bodyExpandWidth}
        />
      ) : null}
      {showAll && includeDecorativePages ? <BridgeSectionCoverPage /> : null}
    </>
  );

  const fromChapter4DividerOnward = (
    <>
      {showAll && includeDecorativePages ? <Chapter3DividerPage /> : null}
      {showAll && includeDecorativePages ? <BridgeIntroPages /> : null}
      {showAll || focus === "bridge"
        ? bridgeChunks.map((blocks, idx) => (
            <BridgesPdfPage
              key={`bridge-chunk-${idx}`}
              blocks={blocks}
              bodyStyle={bodyStyle}
              bodyExpandWidth={bodyExpandWidth}
            />
          ))
        : null}
      {INCLUDE_BRIDGE_REFERENCE_IN_REPORT_PDF && showAll ? <BridgeReferencePage /> : null}
      {showAll && includeDecorativePages ? <JournalInviteLeadPage /> : null}
      {showAll && includeDecorativePages ? <JournalInvitePagesFromChapter4Divider /> : null}
      {showAll && includeDecorativePages ? <PersonalMonthIntroExtraPage /> : null}
      {showAll ? (
        <PersonalMonthBonusPage
          birthMonth={order.birthMonth}
          birthDay={order.birthDay}
          purchaseDate={purchaseDate}
        />
      ) : null}
      {showAll && includeDecorativePages ? <AfterwordPages /> : null}
    </>
  );

  const content =
    segment === "beforeChapter3Insert"
      ? beforeChapter3Insert
      : segment === "chapter3ThroughJournalInviteLead"
        ? chapter3ThroughJournalInviteLead
        : segment === "fromChapter4DividerOnward"
          ? fromChapter4DividerOnward
          : (
              <>
                {beforeChapter3Insert}
                {chapter3ThroughJournalInviteLead}
                {fromChapter4DividerOnward}
              </>
            );

  return <PdfQualityProvider quality={quality}>{content}</PdfQualityProvider>;
}
