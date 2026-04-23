"use client";

import Link from "next/link";

import { SegmentErrorUI } from "@/components/system/SegmentError";

/** ルート配下の未捕捉エラー（主要セグメント以外） */
export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="space-y-4">
      <SegmentErrorUI error={error} reset={reset} title="ページの表示中にエラーが発生しました" />
      <p className="text-sm text-stone-600">
        <Link href="/" className="text-stone-800 underline">
          トップへ戻る
        </Link>
      </p>
    </div>
  );
}
