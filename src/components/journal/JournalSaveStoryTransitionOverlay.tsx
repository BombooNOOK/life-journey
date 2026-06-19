type Props = {
  randomLine: string;
};

/** 新規日記保存直後：ストーリーのように一瞬だけ表示するフクロウ演出 */
export function JournalSaveStoryTransitionOverlay({ randomLine }: Props) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#faf8f5]/95 backdrop-blur-[3px]"
      aria-live="polite"
      aria-busy="true"
      role="status"
    >
      <div className="mx-6 max-w-sm">
        <div className="rounded-2xl border border-[#e8dfd0] bg-[#f7f1e6] px-6 py-6 text-center shadow-lg">
          <p className="text-sm leading-7 text-stone-700">
            フクロウ先生が、
            <br />
            この日の数字をひらいています…
          </p>
          <p className="mt-5 whitespace-pre-wrap text-sm leading-7 text-stone-600">{randomLine}</p>
        </div>
      </div>
    </div>
  );
}
