"use client";

import Link from "next/link";

import { useFirebaseAuth } from "@/components/auth/FirebaseAuthProvider";
import { MyPageAccountSectionCard } from "@/components/orders/MyPageAccountSectionCard";
import { OwlLoadingInline } from "@/components/ui/OwlLoadingInline";
import { mobileReadable } from "@/lib/auth/mobileReadableStyles";
import { MYPAGE_CONTACT_FORM_PATH } from "@/lib/legal/legalDocumentLinks";
import { formatMyPageProfileLimitLabel } from "@/lib/profile/effectiveProfileLimit";
import { deriveSubscriptionPlanLabel } from "@/lib/stripe/plans";
import { SUBSCRIPTION_CANCEL_PENDING_BILLING_NOTE } from "@/lib/stripe/subscriptionBillingCopy";
import type { SubscriptionCancelState } from "@/lib/stripe/subscriptionCancelState";

type Props = {
  viewerEmail: string;
  subscriptionPlan: string | null;
  profileLimit: number;
  isMonitor?: boolean;
  registeredAtLabel: string;
  subscriptionCancelState: SubscriptionCancelState;
};

function usesGoogleSignInOnly(user: ReturnType<typeof useFirebaseAuth>["user"]): boolean {
  if (!user) return false;
  const hasGoogle = user.providerData.some((p) => p.providerId === "google.com");
  const hasPassword = user.providerData.some((p) => p.providerId === "password");
  return hasGoogle && !hasPassword;
}

export function MyPageAccountSection({
  viewerEmail,
  subscriptionPlan,
  profileLimit,
  isMonitor = false,
  registeredAtLabel,
  subscriptionCancelState,
}: Props) {
  const { user, loading: authLoading } = useFirebaseAuth();
  const planLabel = deriveSubscriptionPlanLabel(subscriptionPlan);
  const googleOnly = usesGoogleSignInOnly(user);

  return (
    <div className="space-y-5 sm:space-y-6">
      <MyPageAccountSectionCard title="基本情報">
        <dl className="lj-read-desc grid gap-3 sm:grid-cols-[7.5rem_1fr]">
          <dt className="text-stone-500">メールアドレス</dt>
          <dd className="break-all text-stone-900">{viewerEmail}</dd>

          <dt className="text-stone-500">登録日</dt>
          <dd className="text-stone-900">{registeredAtLabel}</dd>
        </dl>
      </MyPageAccountSectionCard>

      <MyPageAccountSectionCard title="どんぐり・定期便">
        <dl className="lj-read-desc grid gap-3 sm:grid-cols-[7.5rem_1fr]">
          <dt className="text-stone-500">現在のご利用</dt>
          <dd className="text-stone-900">{planLabel}</dd>

          <dt className="text-stone-500">プロフィール上限</dt>
          <dd className="text-stone-900">
            {formatMyPageProfileLimitLabel({ isMonitor, profileLimit })}
          </dd>
        </dl>

        <div className="space-y-3 border-t border-stone-100 pt-4">
          <Link
            href="/plans"
            className="inline-flex min-h-[44px] items-center rounded-lg border border-violet-300 bg-violet-50 px-4 py-2.5 text-base font-medium text-violet-950 transition hover:bg-violet-100"
          >
            どんぐりと森の定期便 →
          </Link>

          {subscriptionCancelState.cancelAtPeriodEnd ? (
            <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-base leading-[1.6] text-amber-950">
              <p className="font-medium">解約申込済み</p>
              {subscriptionCancelState.periodEndLabel ? (
                <>
                  <p className="mt-1">{subscriptionCancelState.periodEndLabel} までご利用いただけます</p>
                  <p className="mt-1 text-sm">{SUBSCRIPTION_CANCEL_PENDING_BILLING_NOTE}</p>
                </>
              ) : null}
            </div>
          ) : subscriptionCancelState.canRequestCancel ? (
            <Link
              href="/orders/account/cancel-plan"
              className="inline-flex min-h-[44px] items-center rounded-lg border border-stone-300 bg-white px-4 py-2.5 text-base font-medium text-stone-800 transition hover:bg-stone-50"
            >
              森の定期便を解約する →
            </Link>
          ) : null}
        </div>
      </MyPageAccountSectionCard>

      <MyPageAccountSectionCard title="ログインとセキュリティ">
        <div className={`space-y-4 ${mobileReadable.body}`}>
          <div>
            <p className="font-medium text-stone-900">メールアドレスの変更</p>
            <p className="mt-1.5 text-stone-700">
              現在準備中です。変更が必要な場合はお問い合わせください。
            </p>
          </div>

          <div>
            <p className="font-medium text-stone-900">パスワード</p>
            {authLoading ? (
              <OwlLoadingInline
                label="ログイン方式を確認しています…"
                size="sm"
                className="mt-1.5 text-stone-600"
              />
            ) : googleOnly ? (
              <p className="mt-1.5 text-stone-700">
                Googleアカウント側で管理されています。
                変更はGoogleのアカウント設定から行ってください。
              </p>
            ) : (
              <p className="mt-1.5 text-stone-700">
                パスワードの変更が必要な場合は、お問い合わせください。
              </p>
            )}
          </div>
        </div>

        <div className="border-t border-stone-100 pt-4">
          <Link
            href={MYPAGE_CONTACT_FORM_PATH}
            className="inline-flex min-h-[44px] items-center rounded-lg border border-stone-300 bg-white px-4 py-2.5 text-base font-medium text-stone-800 transition hover:bg-stone-50"
          >
            お問い合わせする →
          </Link>
        </div>
      </MyPageAccountSectionCard>

      <MyPageAccountSectionCard
        title="申込・コード確認"
        footer={
          <Link
            href="#profile-list"
            className="inline-flex text-sm font-medium text-emerald-900 underline-offset-2 hover:underline"
          >
            プロフィール一覧へ
          </Link>
        }
      >
        <p className={`${mobileReadable.bodyMuted} text-sm`}>
          鑑定コード・製本申し込みコードは、各プロフィールの本棚から確認できます。
        </p>
      </MyPageAccountSectionCard>

      <MyPageAccountSectionCard title="データ管理">
        <p className={mobileReadable.bodyMuted}>
          保存されている日記・写真・鑑定結果などの管理ができます。
        </p>
        <div className="border-t border-stone-100 pt-4">
          <Link
            href="/orders/account/delete"
            className="inline-flex min-h-[44px] items-center rounded-lg border border-red-200 bg-white px-4 py-2.5 text-base font-medium text-red-800 transition hover:bg-red-50"
          >
            アカウントを削除する
          </Link>
        </div>
      </MyPageAccountSectionCard>
    </div>
  );
}
