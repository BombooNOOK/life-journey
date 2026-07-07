import type { Metadata } from "next";

import { FirstVisitRegistrationBackGuard } from "@/components/guide/first-visit/FirstVisitRegistrationBackGuard";
import { TransitionNavigationProvider } from "@/components/ui/TransitionNavigationProvider";

export const metadata: Metadata = {
  title: "はじめての方へ",
  description:
    "BambooNOOKの森へようこそ。Life Journey Diary のはじめ方を、フクロウ先生がやさしくご案内します。",
};

export default function FirstVisitLayout({ children }: { children: React.ReactNode }) {
  return (
    <FirstVisitRegistrationBackGuard>
      <TransitionNavigationProvider>{children}</TransitionNavigationProvider>
    </FirstVisitRegistrationBackGuard>
  );
}
