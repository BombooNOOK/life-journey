import type { Metadata } from "next";

import { JournalSocialPostImagePreviewClient } from "@/app/preview/journal-social-post-image/JournalSocialPostImagePreviewClient";

export const metadata: Metadata = {
  title: "投稿画像プレビュー",
  robots: { index: false, follow: false },
};

export default function JournalSocialPostImagePreviewPage() {
  return <JournalSocialPostImagePreviewClient />;
}
