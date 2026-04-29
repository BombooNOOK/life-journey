"use client";

import Link from "next/link";

import { SegmentErrorUI } from "@/components/system/SegmentError";

export default function LoginError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="space-y-4">
      <SegmentErrorUI
        error={error}
        reset={reset}
        title="ログイン画面の表示中にエラーが発生しました"
      />
      <p className="text-sm text-stone-600">
        <Link href="/" className="text-stone-800 underline">
          トップへ戻る
        </Link>
      </p>
    </div>
  );
}
