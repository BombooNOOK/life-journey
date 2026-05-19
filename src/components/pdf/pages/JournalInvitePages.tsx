import { SHOW_JOURNAL_INVITE_LEAD_PAGE } from "@/lib/pdf/chapterInsertConfig";

import { PdfPageFrame } from "../PdfPageFrame";
import { PDF_JOURNAL_INVITE_PAGE_1_PATH } from "../pdfAssetPaths";
import { ChapterDividerBleedPage } from "./ChapterDividerBleedPage";
import { JournalMemoLeftPage, JournalMemoRightPage } from "./JournalMemoPages";
import { JournalPrioritiesPage } from "./JournalPrioritiesPage";
import { JournalRetrospectPage } from "./JournalRetrospectPage";

/** おまけブロックの 1 ページ目のみ（第4章扉の前。ここと第4章のあいだに外部 PDF を挟めるように分割） */
export function JournalInviteLeadPage() {
  return (
    <PdfPageFrame
      title="フクロウ先生からのご案内"
      pageType="writing"
      showHeader={false}
      fullBleedImageSrc={PDF_JOURNAL_INVITE_PAGE_1_PATH}
    />
  );
}

/** 第4章扉＋おまけ 2〜5 ページ目 */
export function JournalInvitePagesFromChapter4Divider() {
  return (
    <>
      <ChapterDividerBleedPage chapter={4} />
      <JournalPrioritiesPage />
      <JournalRetrospectPage />
      <JournalMemoLeftPage />
      <JournalMemoRightPage />
    </>
  );
}

/**
 * おまけページの後に差し込む 5 ページ（全面画像・ヘッダーなし・ページ番号あり）。
 * 1: fukuro04（旧ブリッジ章後メッセージ・`SHOW_JOURNAL_INVITE_LEAD_PAGE`） / 2: taisetsu / …
 */
export function JournalInvitePages() {
  return (
    <>
      {SHOW_JOURNAL_INVITE_LEAD_PAGE ? <JournalInviteLeadPage /> : null}
      <JournalInvitePagesFromChapter4Divider />
    </>
  );
}
