type Props = {
  body: string;
  className?: string;
};

/** 日記プレビュー：フクロウ先生の振り返り（今日のヒント正本引用） */
export function JournalOwlDayHintReflectionSection({ body, className = "" }: Props) {
  return (
    <section
      className={[
        "rounded-xl border border-[#e8dfd0] bg-[#f7f1e6] px-4 py-4 shadow-sm sm:px-5 sm:py-5",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <h3 className="lj-read-desc font-semibold text-stone-800">フクロウ先生より</h3>
      <p className="lj-read-comment mt-3 whitespace-pre-wrap break-words text-stone-800">{body}</p>
    </section>
  );
}
