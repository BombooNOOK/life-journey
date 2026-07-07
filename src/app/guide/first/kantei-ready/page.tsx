import type { Metadata } from "next";

import { FirstVisitKanteiReadyPage } from "@/components/guide/first-visit/FirstVisitKanteiReadyPage";

export const metadata: Metadata = {
  title: "はじめての方へ",
};

/** 第9幕：鑑定のへや（ログハウス完成後） */
export default function GuideFirstKanteiReadyPage() {
  return <FirstVisitKanteiReadyPage />;
}
