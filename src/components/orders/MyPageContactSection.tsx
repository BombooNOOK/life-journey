"use client";

import Link from "next/link";
import { useState } from "react";

import { PRIVACY_POLICY_LABEL, PRIVACY_POLICY_PATH } from "@/lib/legal/legalDocumentLinks";

import {
  SUPPORT_INQUIRY_CATEGORIES,
  SUPPORT_INQUIRY_CATEGORY_LABELS,
  SUPPORT_INQUIRY_MESSAGE_MAX_LENGTH,
} from "@/lib/support/supportInquiryTypes";

type Props = {
  viewerEmail: string;
};

export function MyPageContactSection({ viewerEmail }: Props) {
  const [category, setCategory] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  async function submitInquiry() {
    setError(null);
    setSuccess(false);
    setBusy(true);
    try {
      const res = await fetch("/api/support/inquiries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ category, message }),
      });
      const data = (await res.json()) as { error?: string; code?: string };
      if (!res.ok) {
        setError(data.error ?? "送信に失敗しました。");
        return;
      }
      setCategory("");
      setMessage("");
      setSuccess(true);
    } catch {
      setError("送信に失敗しました。時間をおいて再度お試しください。");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section
      id="contact-form"
      className="scroll-mt-6 space-y-4 rounded-xl border border-stone-200 bg-white p-4 shadow-sm sm:p-5"
    >
      <div>
        <h2 className="text-lg font-semibold text-stone-900">お問い合わせ</h2>
        <p className="mt-2 text-sm leading-relaxed text-stone-700">
          プロフィール削除、バックアップ復元、製本申込、その他ご不明点がある場合はこちらからお問い合わせください。
        </p>
        <p className="mt-2 text-xs text-stone-500">
          ログイン中のアカウント（{viewerEmail}）として送信します。
        </p>
        <p className="mt-2 text-xs leading-relaxed text-stone-500">
          個人情報の取扱いについては
          <Link
            href={PRIVACY_POLICY_PATH}
            className="mx-1 text-stone-700 underline-offset-2 hover:underline"
          >
            {PRIVACY_POLICY_LABEL}
          </Link>
          をご確認ください。
        </p>
      </div>

      {success ? (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-3 text-sm leading-relaxed text-emerald-950" role="status">
          <p>お問い合わせを受け付けました。</p>
          <p className="mt-1">内容を確認のうえ、必要に応じて運営よりご連絡します。</p>
        </div>
      ) : null}

      <div className="space-y-4">
        <div>
          <label htmlFor="support-inquiry-category" className="block text-sm font-medium text-stone-800">
            お問い合わせ種別
          </label>
          <select
            id="support-inquiry-category"
            value={category}
            disabled={busy}
            onChange={(e) => setCategory(e.target.value)}
            className="mt-1.5 w-full max-w-md rounded-md border border-stone-300 bg-white px-3 py-2 text-sm text-stone-900 disabled:opacity-60"
          >
            <option value="">選択してください</option>
            {SUPPORT_INQUIRY_CATEGORIES.map((value) => (
              <option key={value} value={value}>
                {SUPPORT_INQUIRY_CATEGORY_LABELS[value]}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="support-inquiry-message" className="block text-sm font-medium text-stone-800">
            内容
          </label>
          <textarea
            id="support-inquiry-message"
            value={message}
            disabled={busy}
            onChange={(e) => setMessage(e.target.value)}
            rows={6}
            maxLength={SUPPORT_INQUIRY_MESSAGE_MAX_LENGTH}
            placeholder="お問い合わせ内容をご記入ください"
            className="mt-1.5 w-full rounded-md border border-stone-300 px-3 py-2 text-sm leading-relaxed text-stone-900 disabled:opacity-60"
          />
          <p className="mt-1 text-xs text-stone-500">
            {message.length} / {SUPPORT_INQUIRY_MESSAGE_MAX_LENGTH} 文字
          </p>
        </div>

        {error ? (
          <p className="text-sm text-red-700" role="alert">
            {error}
          </p>
        ) : null}

        <button
          type="button"
          disabled={busy}
          onClick={() => void submitInquiry()}
          className="inline-flex min-h-[44px] items-center rounded-lg bg-stone-800 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-stone-700 disabled:opacity-60"
        >
          {busy ? "送信中…" : "送信する"}
        </button>
      </div>
    </section>
  );
}
