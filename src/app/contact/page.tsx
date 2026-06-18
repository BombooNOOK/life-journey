import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { GuestContactSection } from "@/components/contact/GuestContactSection";
import { GuestReadingFontSizeBand } from "@/components/reading/GuestReadingFontSizeBand";
import { getViewerEmailFromCookie } from "@/lib/auth/viewer";
import { MYPAGE_CONTACT_FORM_PATH } from "@/lib/legal/legalDocumentLinks";

export const metadata: Metadata = {
  title: "お問い合わせ",
  description: "Life Journey Diaryへのお問い合わせフォームです。",
};

export default async function ContactPage() {
  const viewerEmail = await getViewerEmailFromCookie();
  if (viewerEmail) {
    redirect(MYPAGE_CONTACT_FORM_PATH);
  }

  return (
    <div className="home-read-scope space-y-4">
      <div id="contact-top" className="scroll-mt-24">
        <Link href="/about" className="text-sm text-stone-600 hover:text-stone-900">
          ← はじめての方へ
        </Link>
        <h1 className="mt-2 text-2xl font-bold text-stone-900">お問い合わせ</h1>
        <p className="mt-1 text-sm text-stone-600">
          ログイン前の方は、返信用メールアドレスを入力してお問い合わせできます。
        </p>
      </div>

      <GuestContactSection />

      <GuestReadingFontSizeBand pageKey="contact" />
    </div>
  );
}
