import type { Metadata } from "next";

import { HomeMockDiaryBookCapture } from "@/components/home/HomeMockDiaryBookCapture";

export const metadata: Metadata = {
  title: "Home Mock Preview — Diary Book",
  robots: { index: false, follow: false },
};

export default function HomeMockDiaryBookPreviewPage() {
  return <HomeMockDiaryBookCapture />;
}
