import { PdfPageFrame } from "../PdfPageFrame";
import {
  PDF_CHAPTER_4_DIVIDER_PATH,
  PDF_JOURNAL_INVITE_PAGE_1_PATH,
  PDF_JOURNAL_INVITE_PAGE_2_PATH,
  PDF_JOURNAL_INVITE_PAGE_3_PATH,
  PDF_JOURNAL_INVITE_PAGE_4_PATH,
  PDF_JOURNAL_INVITE_PAGE_5_PATH,
} from "../pdfAssetPaths";

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
      <PdfPageFrame
        title="第4章"
        pageType="guide"
        showHeader={false}
        fullBleedImageSrc={PDF_CHAPTER_4_DIVIDER_PATH}
      />
      <PdfPageFrame
        title="大切にしたいこと"
        pageType="writing"
        showHeader={false}
        fullBleedImageSrc={PDF_JOURNAL_INVITE_PAGE_2_PATH}
      />
      <PdfPageFrame
        title="振り返り"
        pageType="writing"
        showHeader={false}
        fullBleedImageSrc={PDF_JOURNAL_INVITE_PAGE_3_PATH}
      />
      <PdfPageFrame
        title="メモ"
        pageType="writing"
        showHeader={false}
        fullBleedImageSrc={PDF_JOURNAL_INVITE_PAGE_4_PATH}
      />
      <PdfPageFrame
        title="メモ"
        pageType="writing"
        showHeader={false}
        fullBleedImageSrc={PDF_JOURNAL_INVITE_PAGE_5_PATH}
      />
    </>
  );
}

/**
 * おまけページの後に差し込む 5 ページ（全面画像・ヘッダーなし・ページ番号あり）。
 * 1: fukuro04 / 2: taisetsu / 3: furikaeri / 4: memo01 / 5: memo02
 */
export function JournalInvitePages() {
  return (
    <>
      <JournalInviteLeadPage />
      <JournalInvitePagesFromChapter4Divider />
    </>
  );
}
