import { DiaryHomeBottomNav } from "@/components/journal/DiaryHomeBottomNav";
import { LJD_PAGE_BG_CLASS } from "@/lib/ljd/ljdPaperSurface";

/**
 * トップ用モック撮影：あしあと画面と同じ下部メニューを含める。
 * オンボーディング誘導バナーは入れない（商用スクショにゲスト向け道しるべが出ないようにする）。
 */
export default function HomeMockPreviewLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className={["pb-24", LJD_PAGE_BG_CLASS, "min-h-[100dvh]"].join(" ")}>
      {children}
      <DiaryHomeBottomNav />
    </div>
  );
}
