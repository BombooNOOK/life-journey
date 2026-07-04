import type { Metadata } from "next";

import { FirstVisitOwlPage } from "@/components/guide/first-visit/FirstVisitOwlPage";

export const metadata: Metadata = {
  title: "はじめての方へ",
};

/** 第3幕：フクロウ先生あいさつ */
export default function FirstVisitOwlRoutePage() {
  return <FirstVisitOwlPage />;
}
