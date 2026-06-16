"use client";

import { DiaryHomeBottomNav } from "@/components/journal/DiaryHomeBottomNav";

type Props = {
  children: React.ReactNode;
};

/** 下部メニュー分の余白 + 固定ナビ */
export function DiaryLoggedInPageShell({ children }: Props) {
  return (
    <div className="pb-24">
      {children}
      <DiaryHomeBottomNav />
    </div>
  );
}
