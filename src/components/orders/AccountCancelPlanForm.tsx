"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { OwlLoadingInline } from "@/components/ui/OwlLoadingInline";

import { mobileReadable } from "@/lib/auth/mobileReadableStyles";
import { SUBSCRIPTION_BILLING_SUMMARY } from "@/lib/stripe/subscriptionBillingCopy";

export function AccountCancelPlanForm() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submitCancel() {
    setError(null);
    setBusy(true);
    try {
      const res = await fetch("/api/account/cancel-subscription", { method: "POST" });
      const json = (await res.json()) as { error?: string; code?: string };
      if (!res.ok) {
        setError(json.error ?? "解約申込の処理に失敗しました。");
        return;
      }
      router.push("/orders/account/cancel-plan/complete");
      router.refresh();
    } catch {
      setError("解約申込の処理に失敗しました。時間をおいて再度お試しください。");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className={`space-y-3 ${mobileReadable.body}`}>
        <p>森の定期便を解約すると、次回以降の請求が停止されます。</p>
        <p>現在の利用期間中は、引き続きログハウスをご利用いただけます。</p>
        <p>利用期間終了後は、日記の作成・閲覧などの有料機能は利用できなくなります。</p>
        <div className="rounded-lg border border-stone-200 bg-stone-50/80 px-4 py-3">
          <p className="font-medium text-stone-900">お支払い・解約について</p>
          <ul className="mt-2 list-disc space-y-1.5 pl-5 text-stone-700">
            {SUBSCRIPTION_BILLING_SUMMARY.map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ul>
        </div>
        <p>
          保存された日記・写真・鑑定結果などのデータは、アカウント削除を行わない限り、一定期間保持されます。
          データの削除をご希望の場合は、別途「アカウント削除」を行ってください。
        </p>
      </div>

      {error ? (
        <div className={mobileReadable.error} role="alert">
          {error}
        </div>
      ) : null}

      <div className="space-y-3">
        <button
          type="button"
          disabled={busy}
          onClick={() => void submitCancel()}
          className={mobileReadable.buttonPrimary}
        >
          {busy ? (
            <OwlLoadingInline label="送信中…" size="sm" />
          ) : (
            "解約を申し込む"
          )}
        </button>
        <Link href="/orders/account" className={mobileReadable.buttonSecondary}>
          解約せずに戻る
        </Link>
      </div>
    </div>
  );
}
