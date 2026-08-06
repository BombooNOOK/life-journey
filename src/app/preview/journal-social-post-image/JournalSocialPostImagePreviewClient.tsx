"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";

import { JournalSocialPostImageDownloadButton } from "@/components/journal/JournalSocialPostImageDownloadButton";
import {
  DEFAULT_JOURNAL_SOCIAL_POST_PHOTO_ADJUST,
  JournalSocialPostImagePhotoAdjustEditor,
} from "@/components/journal/JournalSocialPostImagePhotoAdjustEditor";
import { buildJournalSocialPostLayoutRulerHref } from "@/lib/journal/social-post-image/layoutRulerUrls";
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
import {
  DEFAULT_JOURNAL_SOCIAL_POST_SUBTITLE,
  extractSocialPostBodyText,
  SOCIAL_POST_SUBTITLE_MAX_CHARS,
  socialPostTitleMaxChars,
} from "@/lib/journal/social-post-image/textExtract";
import { JOURNAL_SOCIAL_POST_PREVIEW_DEMO_CONTENT } from "@/lib/journal/social-post-image/previewDemoContent";
import {
  JOURNAL_SOCIAL_POST_TEMPLATES,
  type JournalSocialPostTemplateId,
} from "@/lib/journal/social-post-image/templates";

const DEMO_ENTRY_ID = "preview-demo";
const DEMO_PHOTO_SRC = "/images/home-mock/demo-journal-photo.png";

/** sns03 本番角度（templates.ts を都度読む） */
function getSns03TemplatePhotoRotateDeg(): number {
  return JOURNAL_SOCIAL_POST_TEMPLATES.sns03.photo.rotateDeg ?? 0;
}

const SNS03_PHOTO_ROTATE_SLIDER = {
  min: -7,
  max: 3,
  step: 0.1,
} as const;

const SNS03_PHOTO_ROTATE_TEST_OPTIONS = [
  { label: "0°", deg: 0 },
  { label: "−2°", deg: -2 },
  { label: "−10°", deg: -10 },
  { label: "+10°", deg: 10 },
] as const;

function clampPhotoRotateDeg(deg: number): number {
  const { min, max, step } = SNS03_PHOTO_ROTATE_SLIDER;
  const clamped = Math.min(max, Math.max(min, deg));
  return Math.round(clamped / step) * step;
}

function formatPhotoRotateDeg(deg: number): string {
  return deg.toFixed(1);
}

function buildPhotoRotateCursorRequest(deg: number): string {
  return `sns03 の写真回転（rotateDeg）を ${formatPhotoRotateDeg(deg)}° にしてください`;
}

type JournalSocialPostImagePreviewClientProps = {
  initialTemplateId?: JournalSocialPostTemplateId;
};

function appendPhotoRotateParam(
  params: URLSearchParams,
  templateId: JournalSocialPostTemplateId,
  photoRotateDeg: number | undefined,
  photoRotateIsOverride: boolean,
): void {
  if (templateId !== "sns03") return;
  params.set("rt", formatPhotoRotateDeg(getSns03TemplatePhotoRotateDeg()));
  if (photoRotateIsOverride && photoRotateDeg !== undefined && Number.isFinite(photoRotateDeg)) {
    params.set("photoRotate", String(photoRotateDeg));
  }
}

function appendTextParams(
  params: URLSearchParams,
  title: string,
  subtitle: string,
  templateId: JournalSocialPostTemplateId,
): void {
  params.set("title", title);
  if (templateId === "sns03") {
    params.set("subtitle", subtitle);
  }
}

function buildPreviewUrl(
  title: string,
  subtitle: string,
  templateId: JournalSocialPostTemplateId,
  photoAdjust: JournalSocialPostPhotoAdjust,
  cacheKey: number,
  photoRotateDeg: number | undefined,
  photoRotateIsOverride: boolean,
): string {
  const params = new URLSearchParams({ template: templateId, t: String(cacheKey) });
  appendTextParams(params, title, subtitle, templateId);
  appendJournalSocialPostPhotoAdjustToSearchParams(params, photoAdjust);
  appendPhotoRotateParam(params, templateId, photoRotateDeg, photoRotateIsOverride);
  return `/api/preview/journal-social-post-image?${params.toString()}`;
}

function buildDownloadUrl(
  title: string,
  subtitle: string,
  templateId: JournalSocialPostTemplateId,
  photoAdjust: JournalSocialPostPhotoAdjust,
  photoRotateDeg: number | undefined,
  photoRotateIsOverride: boolean,
): string {
  const params = new URLSearchParams({ template: templateId, download: "1" });
  appendTextParams(params, title, subtitle, templateId);
  appendJournalSocialPostPhotoAdjustToSearchParams(params, photoAdjust);
  appendPhotoRotateParam(params, templateId, photoRotateDeg, photoRotateIsOverride);
  return `/api/preview/journal-social-post-image?${params.toString()}`;
}

export function JournalSocialPostImagePreviewClient({
  initialTemplateId = "sns02",
}: JournalSocialPostImagePreviewClientProps) {
  const [title, setTitle] = useState("イスの下からこんに");
  const [subtitle, setSubtitle] = useState(DEFAULT_JOURNAL_SOCIAL_POST_SUBTITLE);
  const [templateId, setTemplateId] = useState<JournalSocialPostTemplateId>(initialTemplateId);
  const [photoRotateDeg, setPhotoRotateDeg] = useState(() =>
    clampPhotoRotateDeg(getSns03TemplatePhotoRotateDeg()),
  );
  const [photoRotateIsOverride, setPhotoRotateIsOverride] = useState(false);
  const [debouncedPhotoRotateDeg, setDebouncedPhotoRotateDeg] = useState(photoRotateDeg);
  const [debouncedPhotoRotateIsOverride, setDebouncedPhotoRotateIsOverride] =
    useState(photoRotateIsOverride);
  const [photoRotateCopyHint, setPhotoRotateCopyHint] = useState(false);
  const [photoAdjustDraft, setPhotoAdjustDraft] = useState<JournalSocialPostPhotoAdjust>(
    DEFAULT_JOURNAL_SOCIAL_POST_PHOTO_ADJUST,
  );
  const [appliedPhotoAdjust, setAppliedPhotoAdjust] = useState<JournalSocialPostPhotoAdjust>(
    DEFAULT_JOURNAL_SOCIAL_POST_PHOTO_ADJUST,
  );
  const [debouncedTitle, setDebouncedTitle] = useState(title);
  const [debouncedSubtitle, setDebouncedSubtitle] = useState(DEFAULT_JOURNAL_SOCIAL_POST_SUBTITLE);
  const [debouncedTemplateId, setDebouncedTemplateId] =
    useState<JournalSocialPostTemplateId>(initialTemplateId);
  const [cacheKey, setCacheKey] = useState(() => Date.now());
  const [loadingPreview, setLoadingPreview] = useState(true);
  const [previewError, setPreviewError] = useState<string | null>(null);

  const bodyPreview = useMemo(
    () => extractSocialPostBodyText(JOURNAL_SOCIAL_POST_PREVIEW_DEMO_CONTENT, templateId),
    [templateId],
  );
  const templatePhoto = JOURNAL_SOCIAL_POST_TEMPLATES[templateId].photo;
  const hasPendingPhotoApply = !journalSocialPostPhotoAdjustEquals(photoAdjustDraft, appliedPhotoAdjust);
  const isSns03 = templateId === "sns03";
  const titleMaxChars = socialPostTitleMaxChars(templateId);

  const templatePhotoRotateDeg = getSns03TemplatePhotoRotateDeg();

  const previewUrl = buildPreviewUrl(
    debouncedTitle,
    debouncedSubtitle,
    debouncedTemplateId,
    appliedPhotoAdjust,
    cacheKey,
    debouncedPhotoRotateDeg,
    debouncedPhotoRotateIsOverride,
  );
  const downloadUrl = buildDownloadUrl(
    debouncedTitle,
    debouncedSubtitle,
    debouncedTemplateId,
    appliedPhotoAdjust,
    debouncedPhotoRotateDeg,
    debouncedPhotoRotateIsOverride,
  );

  useEffect(() => {
    const stored = getDefaultOrStoredPhotoAdjust(DEMO_ENTRY_ID, templateId);
    setPhotoAdjustDraft(stored);
    setAppliedPhotoAdjust(stored);
    setCacheKey((value) => value + 1);
  }, [templateId]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedTitle(title);
      setDebouncedSubtitle(subtitle);
      setDebouncedTemplateId(templateId);
      setCacheKey((value) => value + 1);
    }, 400);
    return () => window.clearTimeout(timer);
  }, [title, subtitle, templateId]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedPhotoRotateDeg(photoRotateDeg);
      setDebouncedPhotoRotateIsOverride(photoRotateIsOverride);
      setCacheKey((value) => value + 1);
    }, 400);
    return () => window.clearTimeout(timer);
  }, [photoRotateDeg, photoRotateIsOverride]);

  useEffect(() => {
    if (photoRotateIsOverride) return;
    setPhotoRotateDeg(clampPhotoRotateDeg(getSns03TemplatePhotoRotateDeg()));
  }, [photoRotateIsOverride, templatePhotoRotateDeg]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    params.delete("photoRotate");
    params.set("template", templateId);
    const query = params.toString();
    const nextUrl = query ? `${window.location.pathname}?${query}` : window.location.pathname;
    window.history.replaceState(null, "", nextUrl);
  }, []);

  useEffect(() => {
    setLoadingPreview(true);
    setPreviewError(null);
  }, [previewUrl]);

  const handlePhotoRotateChange = useCallback((deg: number, asOverride = true) => {
    setPhotoRotateDeg(clampPhotoRotateDeg(deg));
    setPhotoRotateIsOverride(asOverride);
  }, []);

  const handlePhotoRotateToTemplate = useCallback(() => {
    setPhotoRotateDeg(clampPhotoRotateDeg(getSns03TemplatePhotoRotateDeg()));
    setPhotoRotateIsOverride(false);
  }, []);

  const handlePhotoRotateNudge = useCallback((delta: number) => {
    setPhotoRotateIsOverride(true);
    setPhotoRotateDeg((current) => clampPhotoRotateDeg(current + delta));
  }, []);

  const handleCopyPhotoRotateRequest = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(buildPhotoRotateCursorRequest(photoRotateDeg));
      setPhotoRotateCopyHint(true);
      window.setTimeout(() => setPhotoRotateCopyHint(false), 2000);
    } catch {
      setPhotoRotateCopyHint(false);
    }
  }, [photoRotateDeg]);

  const handlePhotoAdjustReset = () => {
    setPhotoAdjustDraft(DEFAULT_JOURNAL_SOCIAL_POST_PHOTO_ADJUST);
    clearJournalSocialPostPhotoAdjustFromStorage(DEMO_ENTRY_ID, templateId);
  };

  const handleApplyPhotoAdjust = useCallback(() => {
    setAppliedPhotoAdjust(photoAdjustDraft);
    writeJournalSocialPostPhotoAdjustToStorage(DEMO_ENTRY_ID, templateId, photoAdjustDraft);
    setCacheKey((value) => value + 1);
  }, [photoAdjustDraft, templateId]);

  return (
    <div className="mx-auto max-w-lg space-y-5 px-4 py-8">
      <div>
        <p className="text-xs font-medium text-violet-800">見るだけページ（ログイン不要）</p>
        <h1 className="mt-2 text-xl font-bold text-stone-900">投稿画像のプレビュー</h1>
        <p className="mt-2 text-sm leading-relaxed text-stone-600">
          あしあとプレビューの「投稿画像」と同じ画面です。2種類のデザインを試せます。
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
        {isSns03 ? (
          <>
            <label className="block space-y-2">
              <span className="text-sm font-medium text-stone-800">タイトル</span>
              <input
                type="text"
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                maxLength={titleMaxChars}
                className="w-full rounded-md border border-stone-300 px-3 py-2 text-base text-stone-900"
              />
            </label>
            <p className="mt-1 text-xs text-stone-500">最大 {titleMaxChars} 文字（1行）</p>
            <label className="mt-4 block space-y-2">
              <span className="text-sm font-medium text-stone-800">サブタイトル</span>
              <input
                type="text"
                value={subtitle}
                onChange={(event) => setSubtitle(event.target.value)}
                maxLength={SOCIAL_POST_SUBTITLE_MAX_CHARS}
                className="w-full rounded-md border border-stone-300 px-3 py-2 text-base text-stone-900"
              />
            </label>
            <div className="mt-4 rounded-lg border border-dashed border-stone-200 bg-stone-50/80 px-3 py-3">
              <p className="text-xs font-medium text-stone-600">本文（自動）</p>
              <p className="mt-1 text-xs text-stone-500">
                {isSns03
                  ? "句点区切りで最大93文字（16字×6行）まで抜粋"
                  : "最初の1文まで抜粋"}
              </p>
              <p className="mt-1 text-sm text-stone-800">{bodyPreview}</p>
            </div>
          </>
        ) : (
          <>
            <label className="block space-y-2">
              <span className="text-sm font-medium text-stone-800">投稿画像用タイトル</span>
              <input
                type="text"
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                maxLength={titleMaxChars}
                className="w-full rounded-md border border-stone-300 px-3 py-2 text-base text-stone-900"
              />
            </label>
            <p className="mt-1 text-xs text-stone-500">最大 {titleMaxChars} 文字（1行）</p>
            <div className="mt-4 rounded-lg border border-dashed border-stone-200 bg-stone-50/80 px-3 py-3">
              <p className="text-xs font-medium text-stone-600">本文（自動）</p>
              <p className="mt-1 text-xs text-stone-500">
                {isSns03
                  ? "句点区切りで最大93文字（16字×6行）まで抜粋"
                  : "最初の1文まで抜粋"}
              </p>
              <p className="mt-1 text-sm text-stone-800">{bodyPreview}</p>
            </div>
          </>
        )}
        <div className="mt-4">
          <JournalSocialPostImagePhotoAdjustEditor
            photoSrc={DEMO_PHOTO_SRC}
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
        {isSns03 ? (
          <div className="mt-4 rounded-lg border border-dashed border-violet-200 bg-violet-50/60 px-3 py-3">
            <p className="text-xs font-medium text-violet-900">写真回転（開発用）</p>
            <p className="mt-1 text-xs leading-relaxed text-violet-800/90">
              0.1° 刻みで調整できます。決まったら下の文をコピーして Cursor に貼ってください。
            </p>

            <div className="mt-3 flex items-baseline justify-between gap-3">
              <p className="text-lg font-semibold tabular-nums text-violet-950">
                {formatPhotoRotateDeg(photoRotateDeg)}°
              </p>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => handlePhotoRotateNudge(-0.1)}
                  className="min-h-[36px] rounded-md border border-violet-300 bg-white px-2.5 py-1 text-sm text-violet-900 hover:bg-violet-100/80"
                >
                  −0.1°
                </button>
                <button
                  type="button"
                  onClick={() => handlePhotoRotateNudge(0.1)}
                  className="min-h-[36px] rounded-md border border-violet-300 bg-white px-2.5 py-1 text-sm text-violet-900 hover:bg-violet-100/80"
                >
                  +0.1°
                </button>
              </div>
            </div>

            <label className="mt-3 block">
              <input
                type="range"
                min={SNS03_PHOTO_ROTATE_SLIDER.min}
                max={SNS03_PHOTO_ROTATE_SLIDER.max}
                step={SNS03_PHOTO_ROTATE_SLIDER.step}
                value={photoRotateDeg}
                onChange={(event) => handlePhotoRotateChange(Number(event.target.value))}
                className="w-full accent-violet-700"
              />
              <div className="mt-1 flex justify-between text-[11px] tabular-nums text-violet-700/80">
                <span>{SNS03_PHOTO_ROTATE_SLIDER.min}°</span>
                <span>{SNS03_PHOTO_ROTATE_SLIDER.max}°</span>
              </div>
            </label>

            <div className="mt-3 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={handlePhotoRotateToTemplate}
                className={[
                  "min-h-[36px] rounded-md border px-3 py-1.5 text-sm",
                  !photoRotateIsOverride
                    ? "border-violet-700 bg-violet-700 text-white"
                    : "border-violet-300 bg-white text-violet-900 hover:bg-violet-100/80",
                ].join(" ")}
              >
                本番（{formatPhotoRotateDeg(templatePhotoRotateDeg)}°）
              </button>
              {SNS03_PHOTO_ROTATE_TEST_OPTIONS.map(({ label, deg }) => {
                const active = photoRotateIsOverride && Math.abs(photoRotateDeg - deg) < 0.05;
                return (
                  <button
                    key={label}
                    type="button"
                    onClick={() => handlePhotoRotateChange(deg)}
                    className={[
                      "min-h-[36px] rounded-md border px-3 py-1.5 text-sm",
                      active
                        ? "border-violet-700 bg-violet-700 text-white"
                        : "border-violet-300 bg-white text-violet-900 hover:bg-violet-100/80",
                    ].join(" ")}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
            {!photoRotateIsOverride ? (
              <p className="mt-2 text-[11px] text-violet-800/90">
                本番モード：サーバーの templates.ts（{formatPhotoRotateDeg(templatePhotoRotateDeg)}°）を使います。
              </p>
            ) : null}

            <div className="mt-4 rounded-md border border-violet-200 bg-white/90 px-3 py-2.5">
              <p className="text-[11px] font-medium text-violet-900">Cursor に渡す文</p>
              <p className="mt-1 break-all text-xs leading-relaxed text-violet-950">
                {buildPhotoRotateCursorRequest(photoRotateDeg)}
              </p>
              <button
                type="button"
                onClick={() => void handleCopyPhotoRotateRequest()}
                className="mt-2 min-h-[36px] rounded-md border border-violet-600 bg-violet-600 px-3 py-1.5 text-sm text-white hover:bg-violet-700"
              >
                {photoRotateCopyHint ? "コピーしました" : "文をコピー"}
              </button>
            </div>
          </div>
        ) : null}
      </div>

      <div className="space-y-3">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <h2 className="text-base font-semibold text-stone-900">プレビュー</h2>
          <JournalSocialPostImageDownloadButton href={downloadUrl} />
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
