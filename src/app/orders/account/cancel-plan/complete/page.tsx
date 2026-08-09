import Link from "next/link";

import { MyPageSubpageHeader } from "@/components/orders/MyPageSubpageHeader";
import { RESIDENT_REGISTRATION_INFO_LABEL } from "@/lib/account/residentRegistrationUiCopy";
import { mobileReadable } from "@/lib/auth/mobileReadableStyles";
import { SUBSCRIPTION_CANCEL_COMPLETE_NOTE } from "@/lib/stripe/subscriptionBillingCopy";

export default function AccountCancelPlanCompletePage() {
  return (
    <div className="space-y-5 sm:space-y-6">
      <MyPageSubpageHeader title="解約申込完了" />

      <section className="space-y-5 rounded-xl border border-stone-200 bg-white p-4 shadow-sm sm:p-5">
        <div className={mobileReadable.notice} role="status">
          <p>森の定期便の解約申込を受け付けました。</p>
          <p className="mt-2">{SUBSCRIPTION_CANCEL_COMPLETE_NOTE}</p>
        </div>

        <Link href="/orders/account" className={mobileReadable.buttonPrimary}>
          {RESIDENT_REGISTRATION_INFO_LABEL}へ戻る
        </Link>
      </section>
    </div>
  );
}
