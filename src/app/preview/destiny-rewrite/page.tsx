import { destinyData } from "@/lib/numerology/destinyData";

const D_KEYS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 11, 22, 33] as const;

function buildPlainText(): string {
  const parts: string[] = [
    "【ディスティニー】リライト済み原稿一覧（destinyData.ts と同じ内容）",
    "",
  ];
  for (const n of D_KEYS) {
    const a = destinyData[n];
    if (!a) continue;
    parts.push(`━━━━ D ${n} ━━━━`);
    parts.push(`見出し: ${a.title}`);
    parts.push("");
    parts.push("■ 本文");
    parts.push(a.article);
    parts.push("");
    parts.push("");
  }
  return parts.join("\n");
}

export default function DestinyRewritePreviewPage() {
  const text = buildPlainText();

  return (
    <div className="min-h-screen bg-stone-50 text-stone-900">
      <div className="mx-auto max-w-4xl px-4 py-8">
        <h1 className="text-xl font-semibold text-stone-800">ディスティニー（リライト済み）テキスト一覧</h1>
        <p className="mt-2 text-sm text-stone-600">
          表示しているのは <code className="rounded bg-stone-200 px-1">src/lib/numerology/destinyData.ts</code>{" "}
          と同じ内容です。コピーして使えます。
        </p>
        <p className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-sm text-stone-600">
          <a href="/preview/life-path-rewrite" className="text-stone-800 underline">
            ライフパス
          </a>
          <a href="/preview/soul-rewrite" className="text-stone-800 underline">
            ソウル
          </a>
          <a href="/preview/personality-rewrite" className="text-stone-800 underline">
            パーソナリティ
          </a>
          <a href="/preview/birthday-rewrite" className="text-stone-800 underline">
            バースデー
          </a>
          <a href="/preview/maturity-rewrite" className="text-stone-800 underline">
            マチュリティ
          </a>
        </p>
        <pre className="mt-6 overflow-x-auto whitespace-pre-wrap break-words rounded-lg border border-stone-200 bg-white p-4 text-sm leading-relaxed text-stone-800 shadow-sm">
          {text}
        </pre>
      </div>
    </div>
  );
}
