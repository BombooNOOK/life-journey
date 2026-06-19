import type { Metadata } from "next";

import { HomeMockJournalPreviewCapture } from "@/components/home/HomeMockJournalPreviewCapture";

export const metadata: Metadata = {
  title: "Home Mock Preview — Journal Preview",
  robots: { index: false, follow: false },
};

export default function HomeMockJournalPreviewPage() {
  return <HomeMockJournalPreviewCapture />;
}
