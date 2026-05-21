"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { DiaryDesignPreview } from "@/components/journal/DiaryDesignPreview";
import { getDiaryDesignLabel, normalizeDiaryDesignTheme, type DiaryDesignId } from "@/lib/journal/meta";

type PreviewEntry = {
  id: string;
  content: string;
  createdAt: string;
  mood: string;
  activity: string;
  companionType: string;
  designTheme?: DiaryDesignId;
  contentFontMode?: string;
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
  const returnToRaw = searchParams.get("returnTo");
  const returnTo =
    returnToRaw && returnToRaw.startsWith("/") && !returnToRaw.startsWith("//") ? returnToRaw : null;
  const [entry, setEntry] = useState<PreviewEntry | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [spread, setSpread] = useState<"cover" | "body">("body");

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
    if (themeParam?.trim()) return normalizeDiaryDesignTheme(themeParam);
    if (!entry?.designTheme) return "simple";
    return normalizeDiaryDesignTheme(entry.designTheme);
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
                デザイン: {getDiaryDesignLabel(designTheme)}
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
            contentFontMode={entry.contentFontMode}
          />
        )}
      </div>

      <div className="flex flex-wrap gap-2">
        {returnTo ? (
          <Link
            href={returnTo}
            className="rounded-lg border border-emerald-300 bg-emerald-50 px-4 py-2 text-sm font-medium text-emerald-900 hover:bg-emerald-100"
          >
            一覧に戻る
          </Link>
        ) : null}
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
        {!returnTo ? (
          <>
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
          </>
        ) : null}
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
