import type { Metadata } from "next";

import { HomeMockJournalCapture } from "@/components/home/HomeMockJournalCapture";

export const metadata: Metadata = {
  title: "Home Mock Preview — Journal",
  robots: { index: false, follow: false },
};

export default function HomeMockJournalPreviewPage() {
  return <HomeMockJournalCapture />;
}
