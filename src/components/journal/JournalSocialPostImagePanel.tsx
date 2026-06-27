"use client";

import { useEffect, useMemo, useState } from "react";

import { extractSocialPostBodyText } from "@/lib/journal/social-post-image/textExtract";

type Props = {
  entryId: string;
  content: string;
};

function buildPreviewUrl(entryId: string, title: string, cacheKey: number): string {
  const params = new URLSearchParams({ title, t: String(cacheKey) });
  return `/api/journal/entries/${encodeURIComponent(entryId)}/social-post-image?${params.toString()}`;
}

function buildDownloadUrl(entryId: string, title: string): string {
  const params = new URLSearchParams({ title, download: "1" });
  return `/api/journal/entries/${encodeURIComponent(entryId)}/social-post-image?${params.toString()}`;
}

export function JournalSocialPostImagePanel({ entryId, content }: Props) {
  const [title, setTitle] = useState("");
  const [debouncedTitle, setDebouncedTitle] = useState("");
  const [cacheKey, setCacheKey] = useState(0);
  const [loadingPreview, setLoadingPreview] = useState(true);
  const [previewError, setPreviewError] = useState<string | null>(null);

  const bodyPreview = useMemo(() => extractSocialPostBodyText(content), [content]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedTitle(title);
      setCacheKey((value) => value + 1);
      setLoadingPreview(true);
      setPreviewError(null);
    }, 400);
    return () => window.clearTimeout(timer);
  }, [title]);

  const previewUrl = buildPreviewUrl(entryId, debouncedTitle, cacheKey);
  const downloadUrl = buildDownloadUrl(entryId, debouncedTitle);

  return (
    <div className="space-y-5">
      <div className="rounded-xl border border-stone-200 bg-white p-4 sm:p-5">
        <label className="block space-y-2">
          <span className="text-sm font-medium text-stone-800">投稿画像用タイトル</span>
          <input
            type="text"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="SNS用のタイトルを入力"
            maxLength={40}
            className="w-full rounded-md border border-stone-300 px-3 py-2 text-base text-stone-900"
          />
        </label>
        <p className="mt-2 text-xs leading-relaxed text-stone-500">
          日記本体には保存されません。Instagram などに載せる見出しとして使います。
        </p>
        <div className="mt-4 rounded-lg border border-dashed border-stone-200 bg-stone-50/80 px-3 py-3">
          <p className="text-xs font-medium text-stone-600">本文（画像に載る抜粋・自動）</p>
          <p className="mt-1 text-sm leading-relaxed text-stone-800">
            {bodyPreview || "（本文なし）"}
          </p>
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-base font-semibold text-stone-900">投稿画像プレビュー</h2>
          <a
            href={downloadUrl}
            download
            className="inline-flex min-h-[44px] items-center rounded-lg bg-emerald-800 px-4 py-2.5 text-sm font-medium text-white hover:bg-emerald-700"
          >
            画像を保存
          </a>
        </div>

        <div className="relative mx-auto w-full max-w-md overflow-hidden rounded-xl border border-stone-200 bg-[#faf8f5] shadow-sm">
          <div className="relative aspect-[4/5] w-full">
            {loadingPreview ? (
              <div className="absolute inset-0 flex items-center justify-center bg-stone-100/80 text-sm text-stone-500">
                生成中…
              </div>
            ) : null}
            {previewError ? (
              <div className="absolute inset-0 flex items-center justify-center bg-red-50 px-4 text-center text-sm text-red-700">
                {previewError}
              </div>
            ) : null}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              key={previewUrl}
              src={previewUrl}
              alt="SNS投稿画像プレビュー"
              className="h-full w-full object-contain"
              onLoad={() => {
                setLoadingPreview(false);
                setPreviewError(null);
              }}
              onError={() => {
                setLoadingPreview(false);
                setPreviewError("プレビューの生成に失敗しました。しばらくしてからお試しください。");
              }}
            />
          </div>
        </div>
        <p className="text-center text-xs text-stone-500">
          1080×1350（4:5）・背景 PNG は後から差し替え可能です
        </p>
      </div>
    </div>
  );
}
