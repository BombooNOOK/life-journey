import { guardianColorStyleForName } from "@/lib/journal/guardianColorDisplay";
import type { TodayHintContent } from "@/lib/kantei/todayHintContent";

type Props = {
  hint: TodayHintContent;
  className?: string;
};

/** 鑑定ページ：今日のヒント（毎日見るメインコンテンツ） */
export function KanteiTodayHintSection({ hint, className = "" }: Props) {
  const guardianStyle = guardianColorStyleForName(hint.guardianColor);

  return (
    <section
      id="today-hint"
      className={[
        "scroll-mt-6 space-y-4 rounded-2xl border border-amber-100 bg-gradient-to-br from-white to-amber-50 p-5 shadow-sm",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <div>
        <h2 className="text-lg font-semibold text-stone-900">今日のヒント</h2>
        <p className="mt-1 text-sm text-stone-600">今日のあなたにそっと寄り添うメッセージです。</p>
      </div>

      <div className="rounded-xl border border-amber-100/80 bg-white/80 p-4">
        <h3 className="flex items-center gap-2 text-sm font-semibold text-stone-700">
          今日のひとこと
          <span aria-hidden>🦉</span>
        </h3>
        <p className="mt-2 text-lg font-medium leading-8 text-stone-900">{hint.message}</p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div
          id="guardian-color"
          className="rounded-xl border bg-white p-4 shadow-sm transition-colors"
          style={{
            borderColor: guardianStyle.borderColor,
            backgroundColor: guardianStyle.backgroundColor,
          }}
        >
          <h3 className="text-sm font-semibold text-stone-700">今日のお守りカラー</h3>
          <p
            className="mt-2 text-2xl font-semibold"
            style={{ color: guardianStyle.textColor }}
          >
            {hint.guardianColor}
          </p>
        </div>
        <div className="rounded-xl border border-stone-200 bg-white p-4 shadow-sm">
          <h3 className="text-sm font-semibold text-stone-700">今日の小さな行動</h3>
          <p className="mt-2 text-sm leading-7 text-stone-700">{hint.smallAction}</p>
        </div>
      </div>
    </section>
  );
}
