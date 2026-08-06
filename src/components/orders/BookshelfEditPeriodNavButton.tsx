"use client";

import type { ReactNode } from "react";

import { OwlNavButton } from "@/components/ui/OwlNavButton";

type Props = {
  bookId: string;
  children?: ReactNode;
  className?: string;
};

/** あしあとブック詳細から「対象期間を変更」へ */
export function BookshelfEditPeriodNavButton({
  bookId,
  children = "対象期間を変更",
  className = "text-sm font-medium text-emerald-800 underline-offset-2 hover:underline",
}: Props) {
  return (
    <OwlNavButton
      href={`/orders/bookshelf/diary-book/${bookId}/edit-period`}
      loadingLabel="対象期間の編集を開いています…"
      className={className}
    >
      {children}
    </OwlNavButton>
  );
}
