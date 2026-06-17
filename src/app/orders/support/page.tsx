import { redirect } from "next/navigation";

import { MyPageContactSection } from "@/components/orders/MyPageContactSection";
import { MyPageSubpageHeader } from "@/components/orders/MyPageSubpageHeader";
import { MyPageSupportInquiriesSection } from "@/components/orders/MyPageSupportInquiriesSection";
import { getViewerEmailFromCookie } from "@/lib/auth/viewer";

export const dynamic = "force-dynamic";

export default async function MyPageSupportPage() {
  const viewerEmail = await getViewerEmailFromCookie();
  if (!viewerEmail) {
    redirect("/login?returnTo=/orders/support");
  }

  return (
    <div className="space-y-5 sm:space-y-6">
      <MyPageSubpageHeader
        title="お問い合わせ履歴"
        description="これまでのお問い合わせを確認できます"
      />

      <MyPageSupportInquiriesSection showHeader={false} />

      <div id="contact-form" className="scroll-mt-24">
        <MyPageContactSection viewerEmail={viewerEmail} />
      </div>
    </div>
  );
}
