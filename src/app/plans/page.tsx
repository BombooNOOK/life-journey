import Link from "next/link";

import { LegalFooterLinks } from "@/components/legal/LegalFooterLinks";
import { PlanCards } from "@/components/plans/PlanCards";
import { StripeIsolationNote } from "@/components/plans/StripeIsolationNote";
import { isAdminEmail } from "@/lib/admin/access";
import { getViewerEmailFromCookie } from "@/lib/auth/viewer";
import { LOG_HOUSE_BACK_LINK } from "@/lib/journal/logHouseLabels";
import { getStripeMode, isStripeCheckoutEnabled } from "@/lib/stripe/mode";

export const dynamic = "force-dynamic";

export default async function PlansPage() {
  const viewerEmail = await getViewerEmailFromCookie();
  const isAdmin = viewerEmail ? await isAdminEmail(viewerEmail) : false;
  const showIsolationNote =
    Boolean(viewerEmail) &&
    isAdmin &&
    !isStripeCheckoutEnabled() &&
    process.env.NODE_ENV !== "production";

  return (
    <div className="space-y-6">
      <div>
        <Link href="/orders" className="text-sm text-stone-600 hover:text-stone-900">
          {LOG_HOUSE_BACK_LINK.label}
        </Link>
        <h1 className="mt-2 text-2xl font-bold text-stone-900">どんぐりと森の定期便</h1>
        <p className="mt-1 text-sm text-stone-600">
          日記を「森のあしあと」として残すときなどに使うどんぐりの、受け取り方の案内です。いまは準備中のため、購入はできません。
        </p>
        {!viewerEmail ? (
          <p className="mt-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
            内容の確認には
            <Link href="/login?returnTo=/plans" className="mx-1 font-medium underline">
              ログイン
            </Link>
            してください。
          </p>
        ) : null}
      </div>

      <PlanCards />

      <StripeIsolationNote enabled={showIsolationNote} stripeMode={getStripeMode()} />

      <section className="space-y-2 rounded-xl border border-stone-200 bg-white px-4 py-4 text-sm leading-relaxed text-stone-700 shadow-sm sm:px-5">
        <h2 className="text-base font-semibold text-stone-900">いまできること</h2>
        <ul className="list-disc space-y-1.5 pl-5">
          <li>日記の下書きはどんぐりなしで残せます</li>
          <li>森にあしあとを残すときは、どんぐりを3こ使います</li>
          <li>ヤギさん郵便や住民登録のお祝いなど、森からのおとどけでどんぐりが増えます</li>
        </ul>
        <p className="pt-1 text-xs text-stone-600">
          残高は
          <Link
            href="/orders/donguri"
            className="mx-0.5 font-medium text-stone-800 underline-offset-2 hover:underline"
          >
            どんぐり帳
          </Link>
          から確認できます。
        </p>
      </section>

      <div className="space-y-2 rounded-xl border border-stone-200 bg-[#faf8f5] px-4 py-4 text-xs leading-relaxed text-stone-600 sm:text-sm">
        <p>課金機能は現在準備中です。公開時に改めてご案内します。</p>
        <LegalFooterLinks />
      </div>
    </div>
  );
}
