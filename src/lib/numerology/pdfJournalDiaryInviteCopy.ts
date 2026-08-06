/**
 * 第4章末「フクロウ先生からのメッセージ＋あしあとのご案内」（`journal-diary-invite-bg.png` + 生成テキスト）。
 * Canva: `shime_honbun` / `shime_cm1` / `shime_cm2` / `shime_qr`（QR は PNG）
 */
export type JournalDiaryInviteCopy = {
  frameTitle: string;
  /** Canva `shime_honbun` */
  mainBody: string;
  /** 署名（本文右下） */
  signature: string;
  /** Canva `shime_cm1` */
  diaryIntroBody: string;
  /** Canva `shime_cm2` */
  homeUrl: string;
};

export const journalDiaryInviteCopyJa: JournalDiaryInviteCopy = {
  frameTitle: "フクロウ先生からのメッセージ",
  mainBody: `この本を通して、
あなたのことや、一年の流れを見てきました。

けれど数秘術では、
年だけでなく、月ごとの流れや、
日ごとの小さなめぐりを見ることもできるんだよ。

ここではおまけとして、
今日から3ヶ月の流れを少しだけのぞいてみましょう。`,
  signature: "フクロウ先生",
  diaryIntroBody: `日々の流れを、自分の言葉と一緒に残していく。
その形として、
「Life Journey Diary」というあしあとがあります。

詳しくは、BambooNOOKのホームページをご覧ください。`,
  homeUrl: "https://bamboonook.base.shop/",
};

export function getJournalDiaryInviteCopy(): JournalDiaryInviteCopy {
  return journalDiaryInviteCopyJa;
}
