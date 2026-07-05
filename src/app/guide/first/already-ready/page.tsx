import type { Metadata } from "next";

import { FirstVisitAlreadyReadyPage } from "@/components/guide/first-visit/FirstVisitAlreadyReadyPage";

export const metadata: Metadata = {
  title: "はじめての方へ",
};

/** 第4幕：住民登録・鑑定済み */
export default function GuideFirstAlreadyReadyPage() {
  return <FirstVisitAlreadyReadyPage />;
}
