import type { Metadata } from "next";

import { FirstVisitWelcomePage } from "@/components/guide/first-visit/FirstVisitWelcomePage";

export const metadata: Metadata = {
  title: "はじめての方へ",
};

export default function FirstVisitWelcomeRoutePage() {
  return <FirstVisitWelcomePage />;
}
