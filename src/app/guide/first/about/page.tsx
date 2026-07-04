import type { Metadata } from "next";

import { FirstVisitAboutPage } from "@/components/guide/first-visit/FirstVisitAboutPage";

export const metadata: Metadata = {
  title: "はじめての方へ",
};

/** 第2幕：Life Journey Diaryとは（リール動画・全画面） */
export default function FirstVisitAboutRoutePage() {
  return <FirstVisitAboutPage />;
}
