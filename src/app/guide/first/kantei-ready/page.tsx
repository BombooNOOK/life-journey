import type { Metadata } from "next";

import { FirstVisitKanteiReadyPage } from "@/components/guide/first-visit/FirstVisitKanteiReadyPage";

export const metadata: Metadata = {
  title: "はじめての方へ",
};

/** 第4幕：鑑定のやかたへ（ログイン済み） */
export default function GuideFirstKanteiReadyPage() {
  return <FirstVisitKanteiReadyPage />;
}
