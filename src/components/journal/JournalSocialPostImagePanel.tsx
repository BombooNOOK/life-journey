"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import { JournalSocialPostImageDownloadButton } from "@/components/journal/JournalSocialPostImageDownloadButton";
import {
  DEFAULT_JOURNAL_SOCIAL_POST_PHOTO_ADJUST,
  JournalSocialPostImagePhotoAdjustEditor,
} from "@/components/journal/JournalSocialPostImagePhotoAdjustEditor";
import {
  appendJournalSocialPostPhotoAdjustToSearchParams,
  journalSocialPostPhotoAdjustEquals,
  type JournalSocialPostPhotoAdjust,
} from "@/lib/journal/social-post-image/photoAdjust";
import {
  clearJournalSocialPostPhotoAdjustFromStorage,
  getDefaultOrStoredPhotoAdjust,
  writeJournalSocialPostPhotoAdjustToStorage,
} from "@/lib/journal/social-post-image/photoAdjustStorage";
import { extractSocialPostBodyText } from "@/lib/journal/social-post-image/textExtract";
import {
  JOURNAL_SOCIAL_POST_TEMPLATES,
  type JournalSocialPostTemplateId,
} from "@/lib/journal/social-post-image/templates";

type Props = {
  entryId: string;
  content: string;
  hasPhoto?: boolean;
  photoSrc?: string | null;
};

function buildPreviewUrl(
  entryId: string,
  title: string,
  templateId: JournalSocialPostTemplateId,
  photoAdjust: JournalSocialPostPhotoAdjust,
  cacheKey: number,
): string {
  const params = new URLSearchParams({ title, template: templateId, t: String(cacheKey) });
  appendJournalSocialPostPhotoAdjustToSearchParams(params, photoAdjust);
  return `/api/journal/entries/${encodeURIComponent(entryId)}/social-post-image?${params.toString()}`;
}

function buildDownloadUrl(
  entryId: string,
  title: string,
  templateId: JournalSocialPostTemplateId,
  photoAdjust: JournalSocialPostPhotoAdjust,
): string {
  const params = new URLSearchParams({ title, template: templateId, download: "1" });
  appendJournalSocialPostPhotoAdjustToSearchParams(params, photoAdjust);
  return `/api/journal/entries/${encodeURIComponent(entryId)}/social-post-image?${params.toString()}`;
}

export function JournalSocialPostImagePanel({
  entryId,
  content,
  hasPhoto = false,
  photoSrc,
}: Props) {
  const [title, setTitle] = useState("");
  const [templateId, setTemplateId] = useState<JournalSocialPostTemplateId>("sns02");
  const [photoAdjustDraft, setPhotoAdjustDraft] = useState<JournalSocialPostPhotoAdjust>(
    DEFAULT_JOURNAL_SOCIAL_POST_PHOTO_ADJUST,
  );
  const [appliedPhotoAdjust, setAppliedPhotoAdjust] = useState<JournalSocialPostPhotoAdjust>(
    DEFAULT_JOURNAL_SOCIAL_POST_PHOTO_ADJUST,
  );
  const [debouncedTitle, setDebouncedTitle] = useState("");
  const [debouncedTemplateId, setDebouncedTemplateId] = useState<JournalSocialPostTemplateId>("sns02");
  const [cacheKey, setCacheKey] = useState(0);
  const [loadingPreview, setLoadingPreview] = useState(true);
  const [previewError, setPreviewError] = useState<string | null>(null);

  const bodyPreview = useMemo(() => extractSocialPostBodyText(content), [content]);
  const photoDisplaySrc = photoSrc?.trim() ?? "";
  const showPhotoAdjust = hasPhoto && photoDisplaySrc.length > 0;
  const templatePhoto = JOURNAL_SOCIAL_POST_TEMPLATES[templateId].photo;
  const hasPendingPhotoApply = !journalSocialPostPhotoAdjustEquals(photoAdjustDraft, appliedPhotoAdjust);

  const previewUrl = buildPreviewUrl(
    entryId,
    debouncedTitle,
    debouncedTemplateId,
    appliedPhotoAdjust,
    cacheKey,
  );
  const downloadUrl = buildDownloadUrl(
    entryId,
    debouncedTitle,
    debouncedTemplateId,
    appliedPhotoAdjust,
  );

  useEffect(() => {
    if (!showPhotoAdjust) {
      setPhotoAdjustDraft(DEFAULT_JOURNAL_SOCIAL_POST_PHOTO_ADJUST);
      setAppliedPhotoAdjust(DEFAULT_JOURNAL_SOCIAL_POST_PHOTO_ADJUST);
      return;
    }
    const stored = getDefaultOrStoredPhotoAdjust(entryId, templateId);
    setPhotoAdjustDraft(stored);
    setAppliedPhotoAdjust(stored);
    setCacheKey((value) => value + 1);
  }, [entryId, templateId, showPhotoAdjust]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedTitle(title);
      setDebouncedTemplateId(templateId);
      setCacheKey((value) => value + 1);
    }, 400);
    return () => window.clearTimeout(timer);
  }, [title, templateId]);

  useEffect(() => {
    setLoadingPreview(true);
    setPreviewError(null);
  }, [previewUrl]);

  const handlePhotoAdjustReset = () => {
    setPhotoAdjustDraft(DEFAULT_JOURNAL_SOCIAL_POST_PHOTO_ADJUST);
    clearJournalSocialPostPhotoAdjustFromStorage(entryId, templateId);
  };

  const handleApplyPhotoAdjust = useCallback(() => {
    setAppliedPhotoAdjust(photoAdjustDraft);
    writeJournalSocialPostPhotoAdjustToStorage(entryId, templateId, photoAdjustDraft);
    setCacheKey((value) => value + 1);
  }, [entryId, photoAdjustDraft, templateId]);

  return (
    <div className="space-y-5">
      <div className="rounded-xl border border-stone-200 bg-white p-4 sm:p-5">
        <fieldset className="space-y-2">
          <legend className="text-sm font-medium text-stone-800">デザイン</legend>
          <div className="flex flex-wrap gap-2">
            {(Object.keys(JOURNAL_SOCIAL_POST_TEMPLATES) as JournalSocialPostTemplateId[]).map(
              (id) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => setTemplateId(id)}
                  className={[
                    "min-h-[44px] rounded-md border px-3 py-2 text-sm",
                    templateId === id
                      ? "border-stone-700 bg-stone-800 text-white"
                      : "border-stone-300 bg-white text-stone-700 hover:bg-stone-50",
                  ].join(" ")}
                >
                  {JOURNAL_SOCIAL_POST_TEMPLATES[id].label}
                </button>
              ),
            )}
          </div>
        </fieldset>

        <label className="mt-4 block space-y-2">
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

        {showPhotoAdjust ? (
          <div className="mt-4">
            <JournalSocialPostImagePhotoAdjustEditor
              photoSrc={photoDisplaySrc}
              targetWidth={templatePhoto.width}
              targetHeight={templatePhoto.height}
              adjust={photoAdjustDraft}
              onChange={setPhotoAdjustDraft}
              onReset={handlePhotoAdjustReset}
              onApply={handleApplyPhotoAdjust}
              hasPendingApply={hasPendingPhotoApply}
              applyingPreview={loadingPreview && !hasPendingPhotoApply}
            />
          </div>
        ) : null}
      </div>

      <div className="space-y-3">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <h2 className="text-base font-semibold text-stone-900">投稿画像プレビュー</h2>
          <JournalSocialPostImageDownloadButton href={downloadUrl} />
        </div>

        <div className="relative mx-auto w-full max-w-md overflow-hidden rounded-xl border border-stone-200 bg-[#faf8f5] shadow-sm">
          <div className="relative aspect-[4/5] w-full">
            {loadingPreview ? (
              <div className="absolute inset-0 z-10 flex items-center justify-center bg-stone-100/80 px-4 text-center text-sm text-stone-600">
                画像を作っています…
                <br />
                初回は10秒ほどかかることがあります
              </div>
            ) : null}
            {previewError ? (
              <div className="absolute inset-0 z-10 flex items-center justify-center bg-red-50 px-4 text-center text-sm text-red-700">
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
      </div>
    </div>
  );
}
