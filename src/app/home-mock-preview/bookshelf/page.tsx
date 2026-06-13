import type { Metadata } from "next";

import { HomeMockBookshelfCapture } from "@/components/home/HomeMockBookshelfCapture";

export const metadata: Metadata = {
  title: "Home Mock Preview — Bookshelf",
  robots: { index: false, follow: false },
};

export default function HomeMockBookshelfPreviewPage() {
  return <HomeMockBookshelfCapture />;
}
