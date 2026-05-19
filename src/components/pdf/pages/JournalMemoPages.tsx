import { JournalMemoBleedPage } from "./JournalMemoBleedPage";

/** 余白 左（方眼のみ）— `journal-invite-4-bg.png` */
export function JournalMemoLeftPage() {
  return <JournalMemoBleedPage page="left" />;
}

/** 余白 右（フクロウ先生つき）— `journal-invite-5-bg.png` */
export function JournalMemoRightPage() {
  return <JournalMemoBleedPage page="right" />;
}
