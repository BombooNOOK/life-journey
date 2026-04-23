"use client";

/**
 * App Router の segment `error.tsx` 用。画面全体を置き換えずに、このセグメント内で拾えるエラーを表示。
 */
export function SegmentErrorUI({
  error,
  reset,
  title = "この画面を表示できませんでした",
}: {
  error: Error & { digest?: string };
  reset: () => void;
  title?: string;
}) {
  return (
    <div className="rounded-xl border border-red-200 bg-red-50 p-5 text-red-900 shadow-sm">
      <h2 className="text-lg font-semibold">{title}</h2>
      <p className="mt-2 whitespace-pre-wrap break-words text-sm">
        {error.message || "不明なエラー"}
      </p>
      {error.digest ? (
        <p className="mt-2 font-mono text-xs text-red-700">digest: {error.digest}</p>
      ) : null}
      <button
        type="button"
        onClick={() => reset()}
        className="mt-4 rounded-lg border border-red-300 bg-white px-4 py-2 text-sm font-medium text-red-900 hover:bg-red-50"
      >
        再試行
      </button>
    </div>
  );
}
