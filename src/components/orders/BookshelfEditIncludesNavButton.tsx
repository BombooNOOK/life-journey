"use client";

import type { ReactNode } from "react";

import { OwlNavButton } from "@/components/ui/OwlNavButton";

type Props = {
  bookId: string;
  children?: ReactNode;
  className?: string;
};

/** 本棚・あしあとブック詳細から「本に入れるあしあとを編集」へ */
export function BookshelfEditIncludesNavButton({
  bookId,
  children = "本に入れるあしあとを編集",
  className = "block w-full rounded-lg border border-emerald-200 bg-white px-3 py-2 text-center text-xs font-medium text-emerald-900 hover:bg-emerald-50",
}: Props) {
  return (
    <OwlNavButton
      href={`/orders/bookshelf/diary-book/${bookId}/edit-includes`}
      loadingLabel="掲載するあしあとを開いています…"
      className={className}
    >
      {children}
    </OwlNavButton>
  );
}
