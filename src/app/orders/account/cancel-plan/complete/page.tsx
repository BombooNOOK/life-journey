import Link from "next/link";

import { MyPageSubpageHeader } from "@/components/orders/MyPageSubpageHeader";
import { mobileReadable } from "@/lib/auth/mobileReadableStyles";

export default function AccountCancelPlanCompletePage() {
  return (
    <div className="space-y-5 sm:space-y-6">
      <MyPageSubpageHeader title="解約申込完了" />

      <section className="space-y-5 rounded-xl border border-stone-200 bg-white p-4 shadow-sm sm:p-5">
        <div className={mobileReadable.notice} role="status">
          有料プランの解約申込を受け付けました。
          現在の利用期間中は、引き続きご利用いただけます。
        </div>

        <Link href="/orders/account" className={mobileReadable.buttonPrimary}>
          アカウント情報へ戻る
        </Link>
      </section>
    </div>
  );
}
