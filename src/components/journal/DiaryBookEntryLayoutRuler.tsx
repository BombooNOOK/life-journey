import {
  DIARY_BOOK_ENTRY_LAYOUT_RULER_SQUARE_PX,
  type DiaryBookEntryLayoutRulerTarget,
} from "@/lib/journal/diaryBookEntryLayoutRuler";

type Props = {
  target: DiaryBookEntryLayoutRulerTarget;
  leftPx: number;
  topPx: number;
};

/** レイアウト微調整用：1辺 = 設計座標 5px の基準マス（プレビューのみ） */
export function DiaryBookEntryLayoutRuler({ target, leftPx, topPx }: Props) {
  const size = DIARY_BOOK_ENTRY_LAYOUT_RULER_SQUARE_PX;
  return (
    <div
      className="pointer-events-none absolute z-[200]"
      style={{ left: `${leftPx}px`, top: `${topPx}px` }}
      aria-hidden
    >
      <div
        className="box-border border border-fuchsia-600 bg-fuchsia-400/90"
        style={{ width: `${size}px`, height: `${size}px` }}
      />
      <p
        className="m-0 mt-0.5 whitespace-nowrap font-mono text-[9px] leading-none text-fuchsia-800"
        style={{ marginLeft: 0 }}
      >
        {size}px（{target}）
      </p>
    </div>
  );
}
