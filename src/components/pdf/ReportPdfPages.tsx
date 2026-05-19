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
import { CoreNumberIntroBleedPage } from "./pages/CoreNumberIntroBleedPage";
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
import { JournalDiaryInvitePage } from "./pages/JournalDiaryInvitePage";
import { MaturityGuidePage } from "./pages/MaturityGuidePage";
import { MaturityPage } from "./pages/MaturityPage";
import { NumerologyPage } from "./pages/NumerologyPage";
import { NumberKeywordsPage } from "./pages/NumberKeywordsPage";
import { PersonalYearDetailPages } from "./pages/PersonalYearDetailPages";
import { PersonalMonthBonusPage } from "./pages/PersonalMonthBonusPage";
import { SHOW_JOURNAL_INVITE_LEAD_PAGE } from "@/lib/pdf/chapterInsertConfig";
import {
  getCoreNumberIntroSubtitle,
  getCoreNumberIntroThemeLine,
} from "@/lib/numerology/pdfCoreIntroSubtitle";
import type { CoreNumberIntroKey } from "@/lib/numerology/pdfCoreNumberIntroCopy";
import { PersonalYearChapterTransitionPage } from "./pages/PersonalYearChapterTransitionPage";
import { PersonalYearAfterMessagePage } from "./pages/PersonalYearAfterMessagePage";
import { PersonalYearGuidePage, PersonalYearMessagePage } from "./pages/PersonalYearIntroPages";
import { PersonalYearOverviewPage } from "./pages/PersonalYearOverviewPage";
import { PersonalityGuidePage } from "./pages/PersonalityGuidePage";
import { PersonalityPage } from "./pages/PersonalityPage";
import { SoulGuidePage } from "./pages/SoulGuidePage";
import { SoulPage } from "./pages/SoulPage";
import { BridgeAfterMessagePage } from "./pages/BridgeAfterMessagePage";
import { BridgeIntroPages } from "./pages/BridgeIntroPages";
import { bodyStyleFromConfig, type PdfRenderConfig } from "./pdfRenderConfig";
import { setPdfRenderQuality } from "./pdfRenderQualityState";

/** ブリッジ参考（全タイプ一覧）は内容が長く複数ページになるため、現行の鑑定 PDF では出さない */
const INCLUDE_BRIDGE_REFERENCE_IN_REPORT_PDF = false;

export type ReportPdfPageSegment =
  /** パーソナルイヤー導入のフクロウ先生ページまで（ここに blank01 を挟む） */
  | "beforeChapter3Insert"
  /** 第2章扉〜PY章後フクロウまで（足跡装飾→章後メッセージ。第3章扉は fromChapter4DividerOnward） */
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
  /** `resolvePdfAssetPath` が参照する。子より先に確定させる（末尾だと初回フレームで quality がずれるリスク） */
  setPdfRenderQuality(renderConfig?.quality ?? "high");

  const maturity = maturityNumberFromNumerology(order.numerology);
  const bridgeBlocks = buildPdfBridgeBlocks(order.numerology);
  const personalYearReferenceDate = new Date();
  const purchaseDate = order.purchaseDateIso ? new Date(order.purchaseDateIso) : new Date();
  const focus = renderConfig?.focusPage ?? "all";
  const showAll = focus === "all";
  /** 全文モードでは章扉・フクロウ先生・ジャーナル誘導なども含める（軽量版でも構成はフル。画質・本文サイズは renderConfig で調整） */
  const includeRichVisualPages = showAll;
  const bodyStyle = renderConfig ? bodyStyleFromConfig(renderConfig) : undefined;
  const bodyExpandWidth = renderConfig?.bodyExpandWidth;
  const bridgeChunkSize = 2;
  const bridgeChunks = [];
  for (let i = 0; i < bridgeBlocks.length; i += bridgeChunkSize) {
    bridgeChunks.push(bridgeBlocks.slice(i, i + bridgeChunkSize));
  }

  const coreIntroPage = (coreKey: CoreNumberIntroKey) => (
    <CoreNumberIntroBleedPage
      coreKey={coreKey}
      subtitle={getCoreNumberIntroSubtitle(coreKey, order, maturity)}
      themeLine={getCoreNumberIntroThemeLine(coreKey, order)}
    />
  );

  const beforeChapter3Insert = (
    <>
      {showAll ? <CoverPage /> : null}
      {showAll ? <InsideCoverPage customer={order} /> : null}
      {showAll ? <CustomerPage /> : null}
      {showAll ? <NumerologyPage numerology={order.numerology} /> : null}
      {showAll ? <IntroductionPages /> : null}
      {showAll ? <NumberKeywordsPage /> : null}
      {showAll && includeRichVisualPages ? <Chapter1DividerPage /> : null}
      {showAll && includeRichVisualPages ? <LifePathGuidePage /> : null}
      {showAll && includeRichVisualPages ? coreIntroPage("lifePath") : null}
      {showAll || focus === "lifePath" ? (
        <LifePathPage
          lifePath={order.numerology.lifePathNumber}
          bodyStyle={bodyStyle}
          bodyExpandWidth={bodyExpandWidth}
        />
      ) : null}
      {showAll && includeRichVisualPages ? <DestinyGuidePage /> : null}
      {showAll && includeRichVisualPages ? coreIntroPage("destiny") : null}
      {showAll ? (
        <DestinyPage
          destiny={order.numerology.destinyNumber}
          bodyStyle={bodyStyle}
          bodyExpandWidth={bodyExpandWidth}
        />
      ) : null}
      {showAll && includeRichVisualPages ? <SoulGuidePage /> : null}
      {showAll && includeRichVisualPages ? coreIntroPage("soul") : null}
      {showAll ? (
        <SoulPage soul={order.numerology.soulNumber} bodyStyle={bodyStyle} bodyExpandWidth={bodyExpandWidth} />
      ) : null}
      {showAll && includeRichVisualPages ? <PersonalityGuidePage /> : null}
      {showAll && includeRichVisualPages ? coreIntroPage("personality") : null}
      {showAll ? (
        <PersonalityPage
          personality={order.numerology.personalityNumber}
          bodyStyle={bodyStyle}
          bodyExpandWidth={bodyExpandWidth}
        />
      ) : null}
      {showAll && includeRichVisualPages ? <BirthdayGuidePage /> : null}
      {showAll && includeRichVisualPages ? coreIntroPage("birthday") : null}
      {showAll ? (
        <BirthdayPage
          birthday={order.numerology.birthdayNumber}
          bodyStyle={bodyStyle}
          bodyExpandWidth={bodyExpandWidth}
        />
      ) : null}
      {showAll && includeRichVisualPages ? <MaturityGuidePage /> : null}
      {showAll && includeRichVisualPages ? coreIntroPage("maturity") : null}
      {showAll ? (
        <MaturityPage maturity={maturity} bodyStyle={bodyStyle} bodyExpandWidth={bodyExpandWidth} />
      ) : null}
      {showAll ? <PersonalYearMessagePage /> : null}
    </>
  );

  const chapter3ThroughJournalInviteLead = (
    <>
      {showAll && includeRichVisualPages ? <Chapter2DividerPage /> : null}
      {showAll && includeRichVisualPages ? <PersonalYearGuidePage /> : null}
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
      {showAll && includeRichVisualPages ? <PersonalYearChapterTransitionPage /> : null}
      {showAll ? <PersonalYearAfterMessagePage /> : null}
    </>
  );

  const fromChapter4DividerOnward = (
    <>
      {showAll && includeRichVisualPages ? <Chapter3DividerPage /> : null}
      {showAll && includeRichVisualPages ? <BridgeIntroPages /> : null}
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
      {showAll ? <BridgeAfterMessagePage /> : null}
      {showAll && includeRichVisualPages && SHOW_JOURNAL_INVITE_LEAD_PAGE ? (
        <JournalInviteLeadPage />
      ) : null}
      {showAll && includeRichVisualPages ? <JournalInvitePagesFromChapter4Divider /> : null}
      {showAll && includeRichVisualPages ? <JournalDiaryInvitePage /> : null}
      {showAll ? (
        <PersonalMonthBonusPage
          birthMonth={order.birthMonth}
          birthDay={order.birthDay}
          purchaseDate={purchaseDate}
        />
      ) : null}
      {showAll && includeRichVisualPages ? <AfterwordPages /> : null}
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

  return content;
}
