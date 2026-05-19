/**
 * 章扉（`chapter-divider-bg.png` + 生成テキスト・4章共通背景）。
 * Canva: `chapter_no` / `chapter_title`
 */
export type ChapterDividerKey = 1 | 2 | 3 | 4;

export type ChapterDividerCopy = {
  frameTitle: string;
  /** Canva `chapter_no`（例: 第１章） */
  chapterNo: string;
  /** Canva `chapter_title` */
  chapterTitle: string;
};

export const chapterDividerCopyJa: Record<ChapterDividerKey, ChapterDividerCopy> = {
  1: {
    frameTitle: "第1章",
    chapterNo: "第１章",
    chapterTitle: "今のあなたを知る",
  },
  2: {
    frameTitle: "第2章",
    chapterNo: "第２章",
    chapterTitle: "これからの流れを知る",
  },
  3: {
    frameTitle: "第3章",
    chapterNo: "第３章",
    chapterTitle: "心の中のズレを知る",
  },
  4: {
    frameTitle: "第4章",
    chapterNo: "第４章",
    chapterTitle: "あなたの言葉を残す",
  },
};

export function getChapterDividerCopy(chapter: ChapterDividerKey): ChapterDividerCopy {
  return chapterDividerCopyJa[chapter];
}
