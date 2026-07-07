"use client";

import type { ReactNode } from "react";

import { useTransitionNavigation } from "@/components/ui/TransitionNavigationProvider";

type Props = {
  href: string;
  className?: string;
  children: ReactNode;
  /** replace 前に呼ぶ */
  onNavigate?: () => void;
};

/** 初回導線の進行リンク（history を積まず、スワイプ戻りと干渉しない） */
export function FirstVisitWizardLink({ href, className, children, onNavigate }: Props) {
  const { replace, isPending } = useTransitionNavigation();

  return (
    <button
      type="button"
      className={className}
      disabled={isPending}
      onClick={() => {
        onNavigate?.();
        replace(href);
      }}
    >
      {children}
    </button>
  );
}
