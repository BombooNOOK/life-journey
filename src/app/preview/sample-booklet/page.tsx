import Link from "next/link";

export default function SampleBookletPreviewPage() {
  const isNotDevelopment = process.env.NODE_ENV !== "development";

  if (isNotDevelopment) {
    return (
      <div className="min-h-screen bg-stone-50 px-4 py-10 text-stone-800">
        <div className="mx-auto max-w-lg rounded-lg border border-stone-200 bg-white p-6 shadow-sm">
          <h1 className="text-lg font-semibold">サンプル冊子 PDF</h1>
          <p className="mt-3 text-sm leading-relaxed text-stone-600">
            このプレビューは <code className="rounded bg-stone-100 px-1">npm run dev</code>{" "}
            の開発モードでのみ利用できます。
          </p>
          <p className="mt-4">
            <Link href="/preview" className="text-sm text-stone-700 underline hover:text-stone-900">
              ← 校正メニューへ
            </Link>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-stone-100 text-stone-900">
      <header className="shrink-0 border-b border-stone-200 bg-white px-4 py-3 shadow-sm">
        <div className="mx-auto flex max-w-6xl flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-base font-semibold text-stone-800">サンプル冊子 PDF（ブラウザ内）</h1>
            <p className="mt-1 text-xs leading-relaxed text-stone-500">
              初回表示はレンダリングのため <strong className="text-stone-700">1〜2 分</strong>
              ほどかかることがあります。そのままお待ちください。
            </p>
          </div>
          <div className="flex flex-wrap gap-2 text-sm">
            <a
              href="/api/dev/sample-booklet"
              target="_blank"
              rel="noreferrer"
              className="rounded-md border border-stone-300 bg-stone-50 px-3 py-1.5 text-stone-800 hover:bg-stone-100"
            >
              PDF だけ新しいタブ
            </a>
            <Link
              href="/preview"
              className="rounded-md border border-transparent px-3 py-1.5 text-stone-600 underline hover:text-stone-900"
            >
              メニューへ
            </Link>
          </div>
        </div>
      </header>
      <iframe
        title="sample-booklet"
        src="/api/dev/sample-booklet"
        className="min-h-0 w-full flex-1 border-0 bg-stone-200"
      />
    </div>
  );
}
