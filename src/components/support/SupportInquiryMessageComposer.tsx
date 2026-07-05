"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { OwlLoadingInline } from "@/components/ui/OwlLoadingInline";

import { SUPPORT_INQUIRY_MESSAGE_MAX_LENGTH } from "@/lib/support/supportInquiryTypes";

type Props = {
  inquiryId: string;
  apiPath: string;
  submitLabel?: string;
  placeholder?: string;
  onSent?: () => void;
};

export function SupportInquiryMessageComposer({
  inquiryId,
  apiPath,
  submitLabel = "送信する",
  placeholder = "メッセージを入力してください",
  onSent,
}: Props) {
  const router = useRouter();
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [emailNotice, setEmailNotice] = useState<string | null>(null);

  async function submitMessage() {
    setError(null);
    setEmailNotice(null);
    setBusy(true);
    try {
      const res = await fetch(apiPath, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ message }),
      });
      const data = (await res.json()) as {
        error?: string;
        emailSent?: boolean;
      };
      if (!res.ok) {
        setError(data.error ?? "送信に失敗しました。");
        return;
      }
      setMessage("");
      if (data.emailSent === false) {
        setEmailNotice("返信は保存しましたが、通知メールは送信できませんでした。");
      }
      onSent?.();
      router.refresh();
    } catch {
      setError("送信に失敗しました。時間をおいて再度お試しください。");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-3 border-t border-stone-100 pt-4">
      <label htmlFor={`support-reply-${inquiryId}`} className="block text-sm font-medium text-stone-800">
        返信を送る
      </label>
      <textarea
        id={`support-reply-${inquiryId}`}
        value={message}
        disabled={busy}
        onChange={(e) => setMessage(e.target.value)}
        rows={4}
        maxLength={SUPPORT_INQUIRY_MESSAGE_MAX_LENGTH}
        placeholder={placeholder}
        className="w-full rounded-md border border-stone-300 px-3 py-2 text-sm leading-relaxed text-stone-900 disabled:opacity-60"
      />
      <p className="text-xs text-stone-500">
        {message.length} / {SUPPORT_INQUIRY_MESSAGE_MAX_LENGTH} 文字
      </p>
      {error ? (
        <p className="text-sm text-red-700" role="alert">
          {error}
        </p>
      ) : null}
      {emailNotice ? (
        <p className="text-sm text-amber-800" role="status">
          {emailNotice}
        </p>
      ) : null}
      <button
        type="button"
        disabled={busy}
        onClick={() => void submitMessage()}
        className="inline-flex min-h-[44px] items-center rounded-lg bg-stone-800 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-stone-700 disabled:opacity-60"
      >
        {busy ? (
          <OwlLoadingInline label="送信中…" size="sm" />
        ) : (
          submitLabel
        )}
      </button>
    </div>
  );
}
