"use client";

import { useTransitionNavigation } from "@/components/ui/TransitionNavigationProvider";

const primaryClass =
  "inline-flex min-h-[44px] flex-1 items-center justify-center rounded-xl bg-emerald-800 px-5 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-emerald-900 active:scale-[0.98] sm:flex-none sm:min-w-[8.5rem]";

const secondaryClass =
  "inline-flex min-h-[44px] flex-1 items-center justify-center rounded-xl border border-emerald-200/90 bg-white px-5 py-2.5 text-sm font-medium text-emerald-950 shadow-sm transition hover:bg-emerald-50/80 active:scale-[0.98] sm:flex-none sm:min-w-[8.5rem]";

type Props = {
  backHref?: string;
  backLabel?: string;
  nextHref?: string;
  nextLabel?: string;
  showBack?: boolean;
  showNext?: boolean;
  onBack?: () => void;
  onNext?: () => void;
};

/** 第2幕以降の単独ページ用：画面下の戻る / 次へ（replace で遷移） */
export function FirstVisitWizardNav({
  backHref,
  backLabel = "戻る",
  nextHref,
  nextLabel = "次へ",
  showBack = true,
  showNext = true,
  onBack,
  onNext,
}: Props) {
  const { replace, isPending } = useTransitionNavigation();

  return (
    <nav
      className="mt-8 flex flex-col-reverse gap-3 border-t border-stone-200/80 pt-6 sm:flex-row sm:items-center sm:justify-between"
      aria-label="案内の進行"
    >
      {showBack && backHref ? (
        <button
          type="button"
          className={secondaryClass}
          disabled={isPending}
          onClick={() => {
            onBack?.();
            replace(backHref);
          }}
        >
          {backLabel}
        </button>
      ) : (
        <span className="hidden sm:block sm:flex-1" aria-hidden />
      )}

      {showNext && nextHref ? (
        <button
          type="button"
          className={primaryClass}
          disabled={isPending}
          onClick={() => {
            onNext?.();
            replace(nextHref);
          }}
        >
          {nextLabel}
        </button>
      ) : null}
    </nav>
  );
}
