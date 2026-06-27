"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import { buildJournalSocialPostLayoutRulerHref } from "@/lib/journal/social-post-image/layoutRulerUrls";
import { extractSocialPostBodyText } from "@/lib/journal/social-post-image/textExtract";
import {
  JOURNAL_SOCIAL_POST_TEMPLATES,
  type JournalSocialPostTemplateId,
} from "@/lib/journal/social-post-image/templates";

const DEMO_CONTENT =
  "今日はモグの病院最終日。おでかけ前の、かわいいひとコマ。";

function buildPreviewUrl(
  title: string,
  templateId: JournalSocialPostTemplateId,
  cacheKey: number,
): string {
  const params = new URLSearchParams({ title, template: templateId, t: String(cacheKey) });
  return `/api/preview/journal-social-post-image?${params.toString()}`;
}

function buildDownloadUrl(title: string, templateId: JournalSocialPostTemplateId): string {
  const params = new URLSearchParams({ title, template: templateId, download: "1" });
  return `/api/preview/journal-social-post-image?${params.toString()}`;
}

export function JournalSocialPostImagePreviewClient() {
  const [title, setTitle] = useState("イスの下からこんにちは");
  const [templateId, setTemplateId] = useState<JournalSocialPostTemplateId>("sns02");
  const [debouncedTitle, setDebouncedTitle] = useState(title);
  const [debouncedTemplateId, setDebouncedTemplateId] = useState<JournalSocialPostTemplateId>("sns02");
  const [cacheKey, setCacheKey] = useState(0);
  const [loadingPreview, setLoadingPreview] = useState(true);
  const [previewError, setPreviewError] = useState<string | null>(null);

  const bodyPreview = useMemo(() => extractSocialPostBodyText(DEMO_CONTENT), []);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedTitle(title);
      setDebouncedTemplateId(templateId);
      setCacheKey((value) => value + 1);
      setLoadingPreview(true);
      setPreviewError(null);
    }, 400);
    return () => window.clearTimeout(timer);
  }, [title, templateId]);

  const previewUrl = buildPreviewUrl(debouncedTitle, debouncedTemplateId, cacheKey);
  const downloadUrl = buildDownloadUrl(debouncedTitle, debouncedTemplateId);

  return (
    <div className="mx-auto max-w-lg space-y-5 px-4 py-8">
      <div>
        <p className="text-xs font-medium text-violet-800">見るだけページ（ログイン不要）</p>
        <h1 className="mt-2 text-xl font-bold text-stone-900">投稿画像のプレビュー</h1>
        <p className="mt-2 text-sm leading-relaxed text-stone-600">
          日記プレビューの「投稿画像」と同じ画面です。2種類のデザインを試せます。
        </p>
        <p className="mt-3 text-sm">
          <Link
            href={buildJournalSocialPostLayoutRulerHref({
              template: templateId,
              returnTo: "/preview/journal-social-post-image",
            })}
            className="text-violet-800 underline hover:text-violet-950"
          >
            レイアウト定規（位置調整用）を開く
          </Link>
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        {(Object.keys(JOURNAL_SOCIAL_POST_TEMPLATES) as JournalSocialPostTemplateId[]).map((id) => (
          <button
            key={id}
            type="button"
            onClick={() => setTemplateId(id)}
            className={[
              "min-h-[44px] rounded-md border px-3 py-2 text-sm",
              templateId === id
                ? "border-stone-700 bg-stone-800 text-white"
                : "border-stone-300 bg-white text-stone-700",
            ].join(" ")}
          >
            {JOURNAL_SOCIAL_POST_TEMPLATES[id].label}
          </button>
        ))}
      </div>

      <div className="rounded-xl border border-stone-200 bg-white p-4">
        <label className="block space-y-2">
          <span className="text-sm font-medium text-stone-800">投稿画像用タイトル</span>
          <input
            type="text"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            className="w-full rounded-md border border-stone-300 px-3 py-2 text-base text-stone-900"
          />
        </label>
        <div className="mt-4 rounded-lg border border-dashed border-stone-200 bg-stone-50/80 px-3 py-3">
          <p className="text-xs font-medium text-stone-600">本文（自動）</p>
          <p className="mt-1 text-sm text-stone-800">{bodyPreview}</p>
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-base font-semibold text-stone-900">プレビュー</h2>
          <a
            href={downloadUrl}
            download
            className="rounded-lg bg-emerald-800 px-4 py-2.5 text-sm font-medium text-white"
          >
            画像を保存
          </a>
        </div>

        <div className="relative overflow-hidden rounded-xl border border-stone-200 bg-[#faf8f5]">
          <div className="relative aspect-[4/5] w-full">
            {loadingPreview ? (
              <div className="absolute inset-0 flex items-center justify-center bg-stone-100 px-4 text-center text-sm text-stone-600">
                画像を作っています…
                <br />
                初回は10秒ほどかかることがあります
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
              alt="投稿画像プレビュー"
              className="h-full w-full object-contain"
              onLoad={() => {
                setLoadingPreview(false);
                setPreviewError(null);
              }}
              onError={() => {
                setLoadingPreview(false);
                setPreviewError("表示できませんでした。");
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
