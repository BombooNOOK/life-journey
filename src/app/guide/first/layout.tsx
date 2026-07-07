import type { Metadata } from "next";

import { FirstVisitBrowserBackGuard } from "@/components/guide/first-visit/FirstVisitBrowserBackGuard";

export const metadata: Metadata = {
  title: "はじめての方へ",
  description:
    "BambooNOOKの森へようこそ。Life Journey Diary のはじめ方を、フクロウ先生がやさしくご案内します。",
};

export default function FirstVisitLayout({ children }: { children: React.ReactNode }) {
  return <FirstVisitBrowserBackGuard>{children}</FirstVisitBrowserBackGuard>;
}
