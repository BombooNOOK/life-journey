import type { Metadata } from "next";

import { FirstVisitRegisterPage } from "@/components/guide/first-visit/FirstVisitRegisterPage";

export const metadata: Metadata = {
  title: "はじめての方へ",
};

/** 第4幕：森の住民登録 */
export default function GuideFirstRegisterPage() {
  return <FirstVisitRegisterPage />;
}
