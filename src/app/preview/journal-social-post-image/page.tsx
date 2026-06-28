import type { Metadata } from "next";

import { JournalSocialPostImagePreviewClient } from "@/app/preview/journal-social-post-image/JournalSocialPostImagePreviewClient";
import { normalizeJournalSocialPostTemplateId } from "@/lib/journal/social-post-image/templates";

export const metadata: Metadata = {
  title: "投稿画像プレビュー",
  robots: { index: false, follow: false },
};

export default async function JournalSocialPostImagePreviewPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const templateRaw = Array.isArray(sp.template) ? sp.template[0] : sp.template;

  return (
    <JournalSocialPostImagePreviewClient
      initialTemplateId={normalizeJournalSocialPostTemplateId(templateRaw)}
    />
  );
}
