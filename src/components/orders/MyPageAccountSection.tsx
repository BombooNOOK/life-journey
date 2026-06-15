"use client";

import Link from "next/link";
import { useState } from "react";
import { sendPasswordResetEmail } from "firebase/auth";

import { useFirebaseAuth } from "@/components/auth/FirebaseAuthProvider";
import { getFirebaseAuth } from "@/lib/firebase/client";
import { getPasswordResetActionCodeSettings } from "@/lib/auth/passwordResetActionCode";
import { PASSWORD_RESET_SENT_NOTICE } from "@/lib/auth/passwordResetCopy";
import { mobileReadable } from "@/lib/auth/mobileReadableStyles";

import { JournalBackupDownloadButton } from "@/components/orders/JournalBackupDownloadButton";
import { formatMyPageProfileLimitLabel } from "@/lib/profile/effectiveProfileLimit";
import { deriveSubscriptionPlanLabel } from "@/lib/stripe/plans";

type Props = {
  viewerEmail: string;
  subscriptionPlan: string | null;
  profileLimit: number;
  isMonitor?: boolean;
  registeredAtLabel: string;
  activeProfileNickname?: string | null;
};

function usesGoogleSignInOnly(user: ReturnType<typeof useFirebaseAuth>["user"]): boolean {
  if (!user) return false;
  const hasGoogle = user.providerData.some((p) => p.providerId === "google.com");
  const hasPassword = user.providerData.some((p) => p.providerId === "password");
  return hasGoogle && !hasPassword;
}

function usesEmailPasswordSignIn(user: ReturnType<typeof useFirebaseAuth>["user"]): boolean {
  if (!user) return false;
  return user.providerData.some((p) => p.providerId === "password");
}

export function MyPageAccountSection({
  viewerEmail,
  subscriptionPlan,
  profileLimit,
  isMonitor = false,
  registeredAtLabel,
  activeProfileNickname,
}: Props) {
  const { user, loading: authLoading } = useFirebaseAuth();
  const [resetBusy, setResetBusy] = useState(false);
  const [resetNotice, setResetNotice] = useState<string | null>(null);
  const [resetError, setResetError] = useState<string | null>(null);

  const planLabel = deriveSubscriptionPlanLabel(subscriptionPlan);
  const googleOnly = usesGoogleSignInOnly(user);
  const emailPassword = usesEmailPasswordSignIn(user);

  async function sendPasswordReset() {
    setResetNotice(null);
    setResetError(null);
    const email = (user?.email ?? viewerEmail).trim();
    if (!email) {
      setResetError("メールアドレスを確認できませんでした。");
      return;
    }
    setResetBusy(true);
    try {
      const auth = getFirebaseAuth();
      const actionCodeSettings = getPasswordResetActionCodeSettings();
      await sendPasswordResetEmail(auth, email, actionCodeSettings);
      setResetNotice(PASSWORD_RESET_SENT_NOTICE);
    } catch {
      setResetNotice(PASSWORD_RESET_SENT_NOTICE);
    } finally {
      setResetBusy(false);
    }
  }

  return (
    <section className="space-y-5 rounded-xl border border-stone-200 bg-white p-4 shadow-sm sm:p-5">
      <h2 className={mobileReadable.sectionTitle}>アカウント情報</h2>

      <dl className="grid gap-3 text-base sm:grid-cols-[7.5rem_1fr]">
        <dt className="text-stone-500">ログイン中</dt>
        <dd className="break-all text-stone-900">{viewerEmail}</dd>

        <dt className="text-stone-500">現在のプラン</dt>
        <dd className="text-stone-900">{planLabel}</dd>

        <dt className="text-stone-500">プロフィール上限</dt>
        <dd className="text-stone-900">
          {formatMyPageProfileLimitLabel({ isMonitor, profileLimit })}
        </dd>

        <dt className="text-stone-500">登録日</dt>
        <dd className="text-stone-900">{registeredAtLabel}</dd>
      </dl>

      <div className="border-t border-stone-100 pt-4">
        <Link
          href="/plans"
          className="inline-flex min-h-[44px] items-center rounded-lg border border-violet-300 bg-violet-50 px-4 py-2.5 text-base font-medium text-violet-950 transition hover:bg-violet-100"
        >
          プランを変更する →
        </Link>
      </div>

      <div className="space-y-4 border-t border-stone-100 pt-4">
        <h3 className="text-base font-semibold text-stone-900">ログインとセキュリティ</h3>

        <div className="rounded-lg border border-stone-200 bg-stone-50/80 px-3 py-3 text-base leading-[1.6] text-stone-700">
          <p className="font-medium text-stone-800">メールアドレスの変更</p>
          <p className="mt-1.5">メールアドレスの変更は現在準備中です。</p>
          <p className="mt-1">変更が必要な場合は、運営までお問い合わせください。</p>
        </div>

        <div className="rounded-lg border border-stone-200 bg-stone-50/80 px-3 py-3 text-base leading-[1.6] text-stone-700">
          <p className="font-medium text-stone-800">パスワード</p>
          {authLoading ? (
            <p className="mt-1.5 text-stone-600">ログイン方式を確認しています…</p>
          ) : googleOnly ? (
            <p className="mt-1.5">
              Googleアカウント側で管理されています。パスワードの変更は Google
              のアカウント設定から行ってください。
            </p>
          ) : emailPassword ? (
            <>
              <p className="mt-1.5">
                登録メールアドレス宛に、パスワード再設定用のリンクを送れます。
              </p>
              <button
                type="button"
                disabled={resetBusy}
                onClick={() => void sendPasswordReset()}
                className="mt-3 inline-flex min-h-[44px] items-center rounded-lg border border-stone-300 bg-white px-4 py-2 text-base font-medium text-stone-800 transition hover:bg-stone-50 disabled:opacity-60"
              >
                {resetBusy ? "送信中…" : "パスワード再設定メールを送る"}
              </button>
              {resetNotice ? (
                <p className="mt-2 text-sm leading-[1.6] text-emerald-800 whitespace-pre-line" role="status">
                  {resetNotice}
                </p>
              ) : null}
              {resetError ? (
                <p className="mt-2 text-xs text-red-700" role="alert">
                  {resetError}
                </p>
              ) : null}
            </>
          ) : (
            <>
              <p className="mt-1.5">
                パスワードの再設定は、ログイン画面からも行えます。
              </p>
              <Link
                href="/login?returnTo=/orders"
                className="mt-3 inline-flex min-h-[44px] items-center rounded-lg border border-stone-300 bg-white px-4 py-2 text-sm font-medium text-stone-800 transition hover:bg-stone-50"
              >
                ログイン画面で再設定する →
              </Link>
            </>
          )}
        </div>
      </div>

      <div className="space-y-2 border-t border-stone-100 pt-4">
        <h3 className="text-sm font-semibold text-stone-900">申込・コード確認</h3>
        <p className="text-sm leading-relaxed text-stone-700">
          鑑定コード・製本申し込みコードは、各プロフィールの本棚で確認できます。
        </p>
        <Link
          href="#profile-list"
          className="inline-flex text-sm font-medium text-emerald-900 underline-offset-2 hover:underline"
        >
          プロフィール一覧へ
        </Link>
      </div>

      <div className="space-y-3 border-t border-stone-100 pt-4">
        <h3 className="text-sm font-semibold text-stone-900">大切な日記をバックアップする</h3>
        {activeProfileNickname ? (
          <p className="text-xs text-stone-600">
            現在選択中のプロフィール「{activeProfileNickname}」の日記を書き出します。
          </p>
        ) : null}
        <p className="text-sm leading-relaxed text-stone-700">
          日記本文・写真・気分・製本に使う情報をZIPファイルとして保存できます。
          バックアップファイルには個人的な内容が含まれるため、安全な場所に保管してください。
        </p>
        <p className="text-xs leading-relaxed text-stone-600">
          バックアップファイルからの復元は、現在、運営確認のうえ個別に対応しています。
          復元時は、既存の日記を上書きせず、新しいプロフィールとして復元します。
          復元をご希望の場合は、お問い合わせください。
        </p>
        <JournalBackupDownloadButton />
      </div>
    </section>
  );
}
