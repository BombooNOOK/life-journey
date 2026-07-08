import type { Metadata } from "next";

import { FirstVisitProgressMarker } from "@/components/guide/first-visit/FirstVisitProgressMarker";
import { FirstVisitRegistrationBackGuard } from "@/components/guide/first-visit/FirstVisitRegistrationBackGuard";
import { FirstVisitWizardHistoryPin } from "@/components/guide/first-visit/FirstVisitWizardHistoryPin";
import { TransitionNavigationProvider } from "@/components/ui/TransitionNavigationProvider";

export const metadata: Metadata = {
  title: "はじめての方へ",
  description:
    "BambooNOOKの森へようこそ。Life Journey Diary のはじめ方を、フクロウ先生がやさしくご案内します。",
};

export default function FirstVisitLayout({ children }: { children: React.ReactNode }) {
  return (
    <FirstVisitRegistrationBackGuard>
      <FirstVisitProgressMarker />
      <FirstVisitWizardHistoryPin />
      <TransitionNavigationProvider>{children}</TransitionNavigationProvider>
    </FirstVisitRegistrationBackGuard>
  );
}
