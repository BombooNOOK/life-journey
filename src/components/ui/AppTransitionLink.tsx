"use client";

import Link from "next/link";
import type { ReactNode } from "react";

import { useTransitionNavigation } from "@/components/ui/TransitionNavigationProvider";

type Props = {
  href: string;
  className?: string;
  children: ReactNode;
  /** 外部リンクのとき true */
  external?: boolean;
};

/** アプリ内リンク：速いときはそのまま、遅いときだけ親 Provider のフクロウ */
export function AppTransitionLink({ href, className, children, external = false }: Props) {
  const { replace, isPending } = useTransitionNavigation();

  if (external) {
    return (
      <a href={href} className={className} target="_blank" rel="noopener noreferrer">
        {children}
      </a>
    );
  }

  return (
    <Link
      href={href}
      className={className}
      aria-busy={isPending}
      onClick={(event) => {
        event.preventDefault();
        replace(href);
      }}
    >
      {children}
    </Link>
  );
}
