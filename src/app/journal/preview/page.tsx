"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { DiaryDesignPreview } from "@/components/journal/DiaryDesignPreview";
import { isDiaryDesignId, type DiaryDesignId } from "@/lib/journal/meta";

type PreviewEntry = {
  id: string;
  content: string;
  createdAt: string;
  mood: string;
  activity: string;
  companionType: string;
  designTheme?: DiaryDesignId;
  photoDataUrl: string | null;
  generatedComment: string | null;
  diaryNumbers?: {
    today: number;
    month: number;
    year: number;
    calmness: number;
  };
};

function JournalPreviewPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const entryId = searchParams.get("entry");
  const themeParam = searchParams.get("theme");
  const [entry, setEntry] = useState<PreviewEntry | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [spread, setSpread] = useState<"cover" | "body">("body");
  const [contentFontScale, setContentFontScale] = useState(1);

  useEffect(() => {
    if (!entryId) {
      setLoading(false);
      setError("表示する記録が指定されていません。");
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError(null);
    void fetch(`/api/journal/${encodeURIComponent(entryId)}`, { cache: "no-store" })
      .then(async (res) => {
        const data = (await res.json()) as { entry?: PreviewEntry; error?: string };
        if (!res.ok || !data.entry) {
          throw new Error(data.error ?? "プレビュー対象の読み込みに失敗しました。");
        }
        if (!cancelled) {
          setEntry(data.entry);
        }
      })
      .catch((e) => {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : "プレビュー対象の読み込みに失敗しました。");
          setEntry(null);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [entryId]);

  const designTheme: DiaryDesignId = useMemo(() => {
    if (themeParam && isDiaryDesignId(themeParam)) return themeParam;
    if (!entry?.designTheme) return "cute";
    return isDiaryDesignId(entry.designTheme) ? entry.designTheme : "cute";
  }, [entry?.designTheme, themeParam]);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="text-2xl font-bold text-stone-900">日記プレビュー</h1>
          <p className="mt-1 text-sm text-stone-600">
            製本時の見え方イメージを、ページをめくるように確認できます。
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setSpread("cover")}
            className={[
              "rounded-md border px-3 py-1.5 text-sm",
              spread === "cover"
                ? "border-stone-700 bg-stone-800 text-white"
                : "border-stone-300 bg-white text-stone-700 hover:bg-stone-50",
            ].join(" ")}
          >
            表紙イメージ
          </button>
          <button
            type="button"
            onClick={() => setSpread("body")}
            className={[
              "rounded-md border px-3 py-1.5 text-sm",
              spread === "body"
                ? "border-stone-700 bg-stone-800 text-white"
                : "border-stone-300 bg-white text-stone-700 hover:bg-stone-50",
            ].join(" ")}
          >
            本文イメージ
          </button>
        </div>
      </div>

      <div className="rounded-xl border border-stone-200 bg-white p-4 shadow-sm">
        {spread === "body" ? (
          <div className="mb-3 rounded-lg border border-stone-200 bg-stone-50 px-3 py-2">
            <label className="block text-xs font-medium text-stone-700" htmlFor="content-font-scale">
              今日の記録フォントサイズ（長文のときは小さめ）
            </label>
            <div className="mt-1 flex items-center gap-3">
              <input
                id="content-font-scale"
                type="range"
                min={70}
                max={115}
                step={1}
                value={Math.round(contentFontScale * 100)}
                onChange={(e) => setContentFontScale(Number(e.target.value) / 100)}
                className="w-full"
              />
              <span className="w-14 text-right text-xs text-stone-600">
                {Math.round(contentFontScale * 100)}%
              </span>
            </div>
          </div>
        ) : null}
        {loading ? (
          <p className="text-sm text-stone-500">プレビューを読み込み中…</p>
        ) : error ? (
          <p className="text-sm text-red-700">{error}</p>
        ) : !entry ? (
          <p className="text-sm text-stone-500">表示する記録がありません。</p>
        ) : spread === "cover" ? (
          <div className="mx-auto max-w-2xl">
            <div className="rounded-xl border border-stone-200 bg-gradient-to-br from-[#f8f3ea] to-[#efe6d8] p-8 text-center shadow-inner">
              <p className="text-xs tracking-[0.2em] text-stone-500">LIFE JOURNEY DIARY</p>
              <h2 className="mt-3 text-2xl font-semibold text-stone-900">
                {new Date(entry.createdAt).getFullYear()}年 日記
              </h2>
              <p className="mt-3 text-sm text-stone-600">
                デザイン: {designTheme === "simple" ? "シンプル系" : "かわいい系（スタンダード）"}
              </p>
              <p className="mt-8 text-sm text-stone-700">
                ※ 表紙は次段で本デザインに合わせて正式連動します（今回先行は本文優先）。
              </p>
            </div>
          </div>
        ) : (
          <DiaryDesignPreview
            designTheme={designTheme}
            mood={entry.mood}
            activity={entry.activity}
            content={entry.content}
            comment={entry.generatedComment}
            photoDataUrl={entry.photoDataUrl}
            previewDate={new Date(entry.createdAt)}
            diaryNumbers={entry.diaryNumbers}
            contentFontScale={contentFontScale}
          />
        )}
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => {
            if (!entry?.id) return;
            router.push(`/journal?edit=${encodeURIComponent(entry.id)}`);
          }}
          className="rounded-lg border border-stone-300 bg-white px-4 py-2 text-sm text-stone-700 hover:bg-stone-50"
        >
          この記録を編集する
        </button>
        <Link
          href="/journal"
          className="rounded-lg border border-stone-300 bg-white px-4 py-2 text-sm text-stone-700 hover:bg-stone-50"
        >
          入力ページへ戻る
        </Link>
        <Link
          href="/orders/bookshelf"
          className="rounded-lg border border-amber-300 bg-amber-50 px-4 py-2 text-sm text-amber-900 hover:bg-amber-100"
        >
          本棚を見る
        </Link>
      </div>
    </div>
  );
}

export default function JournalPreviewPage() {
  return (
    <Suspense fallback={<p className="text-sm text-stone-500">読み込み中…</p>}>
      <JournalPreviewPageContent />
    </Suspense>
  );
}
