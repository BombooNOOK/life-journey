"use client";

import type { ReactNode } from "react";
import { useRouter } from "next/navigation";

type Props = {
  href: string;
  className?: string;
  children: ReactNode;
  /** replace 前に呼ぶ（遷移中ローディング表示など） */
  onNavigate?: () => void;
};

/** 初回導線の進行リンク（history を積まず、スワイプ戻りと干渉しない） */
export function FirstVisitWizardLink({ href, className, children, onNavigate }: Props) {
  const router = useRouter();

  return (
    <button
      type="button"
      className={className}
      onClick={() => {
        onNavigate?.();
        router.replace(href);
      }}
    >
      {children}
    </button>
  );
}
