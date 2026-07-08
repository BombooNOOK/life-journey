"use client";

import { useTransitionNavigation } from "@/components/ui/TransitionNavigationProvider";
import {
  FIRST_VISIT_PAUSE_LINK_HREF,
  FIRST_VISIT_PAUSE_LINK_LABEL,
} from "@/lib/onboarding/firstVisitWizard/backBlockCopy";

type Props = {
  className?: string;
};

/** 初回導線の途中で森の入口へ戻る（ログイン済みでも安全に抜けられる） */
export function FirstVisitPauseLink({ className = "" }: Props) {
  const { replace, isPending } = useTransitionNavigation();

  return (
    <button
      type="button"
      disabled={isPending}
      onClick={() => replace(FIRST_VISIT_PAUSE_LINK_HREF)}
      className={[
        "text-sm text-stone-500 underline-offset-2 transition hover:text-stone-700 hover:underline disabled:opacity-60",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {FIRST_VISIT_PAUSE_LINK_LABEL}
    </button>
  );
}
