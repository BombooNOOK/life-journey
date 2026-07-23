"use client";

import type { ReactNode } from "react";

import { OwlNavButton } from "@/components/ui/OwlNavButton";

type Props = {
  bookId: string;
  children?: ReactNode;
  className?: string;
};

/** 日記ブック詳細から「タグ条件を変更」へ */
export function BookshelfEditTagsNavButton({
  bookId,
  children = "タグ条件を変更",
  className = "text-sm font-medium text-emerald-800 underline-offset-2 hover:underline",
}: Props) {
  return (
    <OwlNavButton
      href={`/orders/bookshelf/diary-book/${bookId}/edit-tags`}
      loadingLabel="タグ条件の編集を開いています…"
      className={className}
    >
      {children}
    </OwlNavButton>
  );
}
