"use client";

import { useMemo, useState } from "react";

import {
  createSocialPostDraft,
  updateSocialPostDraft,
} from "@/app/admin/post-atelier/actions";
import { assembleSocialPostCopyText, generateTemplateDraftBody } from "@/lib/admin/post-atelier/generateTemplateDraft";
import {
  formatUniversalDayBreakdown,
  universalDayForScheduledDate,
} from "@/lib/admin/post-atelier/universalDayForScheduledDate";
import {
  SOCIAL_POST_DRAFT_STATUSES,
  SOCIAL_POST_DRAFT_STATUS_LABELS,
  SOCIAL_POST_PLATFORMS,
  SOCIAL_POST_PLATFORM_LABELS,
  type SocialPostDraftFormValues,
} from "@/lib/admin/post-atelier/types";
import { companionOptions } from "@/lib/journal/meta";

type Props = {
  mode: "create" | "edit";
  draftId?: string;
  initialValues: SocialPostDraftFormValues;
};

const inputClassName =
  "w-full rounded-md border border-stone-300 px-3 py-2 text-sm text-stone-900";
const labelClassName = "block text-sm font-medium text-stone-800";

export function PostAtelierDraftForm({ mode, draftId, initialValues }: Props) {
  const [theme, setTheme] = useState(initialValues.theme);
  const [companionType, setCompanionType] = useState(initialValues.companionType);
  const [platform, setPlatform] = useState(initialValues.platform);
  const [scheduledDate, setScheduledDate] = useState(initialValues.scheduledDate);
  const [bodyText, setBodyText] = useState(initialValues.bodyText);
  const [hashtags, setHashtags] = useState(initialValues.hashtags);
  const [imageMemo, setImageMemo] = useState(initialValues.imageMemo);
  const [linkUrl, setLinkUrl] = useState(initialValues.linkUrl);
  const [internalMemo, setInternalMemo] = useState(initialValues.internalMemo);
  const [status, setStatus] = useState(initialValues.status);
  const [copyState, setCopyState] = useState<"idle" | "copied" | "failed">("idle");

  const universalDay = useMemo(
    () => universalDayForScheduledDate(scheduledDate),
    [scheduledDate],
  );
  const universalDayBreakdown = useMemo(
    () => formatUniversalDayBreakdown(scheduledDate),
    [scheduledDate],
  );

  const copyText = useMemo(
    () =>
      assembleSocialPostCopyText({
        bodyText,
        hashtags,
        linkUrl,
      }),
    [bodyText, hashtags, linkUrl],
  );

  async function handleCopy() {
    if (!copyText.trim()) {
      setCopyState("failed");
      return;
    }
    try {
      await navigator.clipboard.writeText(copyText);
      setCopyState("copied");
      window.setTimeout(() => setCopyState("idle"), 2000);
    } catch {
      setCopyState("failed");
    }
  }

  function handleGenerateTemplate() {
    const generated = generateTemplateDraftBody({
      theme,
      companionType,
      platform,
      scheduledDate,
      todayNumber: universalDay,
    });
    setBodyText(generated);
  }

  const saveAction = mode === "create" ? createSocialPostDraft : updateSocialPostDraft;

  return (
    <div className="space-y-6">
      <form action={saveAction} className="space-y-5 rounded-2xl border border-stone-200 bg-white p-5">
        {mode === "edit" && draftId ? <input type="hidden" name="id" value={draftId} /> : null}

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="space-y-1 sm:col-span-2">
            <span className={labelClassName}>テーマ</span>
            <input
              type="text"
              name="theme"
              value={theme}
              onChange={(e) => setTheme(e.target.value)}
              placeholder="例：今日の数字シリーズ"
              className={inputClassName}
            />
          </label>

          <label className="space-y-1">
            <span className={labelClassName}>キャラ</span>
            <select
              name="companionType"
              value={companionType}
              onChange={(e) => setCompanionType(e.target.value as typeof companionType)}
              className={inputClassName}
            >
              {companionOptions.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.label}
                </option>
              ))}
            </select>
          </label>

          <label className="space-y-1">
            <span className={labelClassName}>投稿先</span>
            <select
              name="platform"
              value={platform}
              onChange={(e) => setPlatform(e.target.value as typeof platform)}
              className={inputClassName}
            >
              {SOCIAL_POST_PLATFORMS.map((p) => (
                <option key={p} value={p}>
                  {SOCIAL_POST_PLATFORM_LABELS[p]}
                </option>
              ))}
            </select>
          </label>

          <label className="space-y-1">
            <span className={labelClassName}>予定日</span>
            <input
              type="date"
              name="scheduledDate"
              value={scheduledDate}
              onChange={(e) => setScheduledDate(e.target.value)}
              className={inputClassName}
            />
          </label>

          <div className="space-y-1">
            <span className={labelClassName}>ユニバーサルデイ（投稿予定日から自動）</span>
            <div className="rounded-md border border-stone-200 bg-stone-50 px-3 py-2 text-sm text-stone-800">
              {universalDay != null ? (
                <>
                  <span className="text-2xl font-semibold tabular-nums">{universalDay}</span>
                  {universalDayBreakdown ? (
                    <p className="mt-1 font-mono text-[11px] text-stone-500">{universalDayBreakdown}</p>
                  ) : null}
                </>
              ) : (
                <span className="text-stone-500">予定日を入力すると計算されます</span>
              )}
            </div>
          </div>

          <label className="space-y-1 sm:col-span-2">
            <span className={labelClassName}>ステータス</span>
            <select
              name="status"
              value={status}
              onChange={(e) => setStatus(e.target.value as typeof status)}
              className={inputClassName}
            >
              {SOCIAL_POST_DRAFT_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {SOCIAL_POST_DRAFT_STATUS_LABELS[s]}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="space-y-2">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className={labelClassName}>投稿文案</span>
            <button
              type="button"
              onClick={handleGenerateTemplate}
              className="rounded-md border border-violet-300 bg-violet-50 px-3 py-1.5 text-xs font-medium text-violet-900 hover:bg-violet-100"
            >
              テンプレ仮生成
            </button>
          </div>
          <textarea
            name="bodyText"
            value={bodyText}
            onChange={(e) => setBodyText(e.target.value)}
            rows={12}
            className={`${inputClassName} font-mono text-[13px] leading-relaxed`}
            placeholder="Instagram 等に貼る本文"
          />
        </div>

        <label className="block space-y-1">
          <span className={labelClassName}>ハッシュタグ</span>
          <textarea
            name="hashtags"
            value={hashtags}
            onChange={(e) => setHashtags(e.target.value)}
            rows={3}
            className={inputClassName}
            placeholder="#BambooNOOK #数秘術"
          />
        </label>

        <label className="block space-y-1">
          <span className={labelClassName}>画像メモ</span>
          <textarea
            name="imageMemo"
            value={imageMemo}
            onChange={(e) => setImageMemo(e.target.value)}
            rows={3}
            className={inputClassName}
            placeholder="素材案・レイアウトメモなど"
          />
        </label>

        <label className="block space-y-1">
          <span className={labelClassName}>リンク</span>
          <input
            type="url"
            name="linkUrl"
            value={linkUrl}
            onChange={(e) => setLinkUrl(e.target.value)}
            placeholder="https://"
            className={inputClassName}
          />
        </label>

        <label className="block space-y-1">
          <span className={labelClassName}>運用メモ（非公開）</span>
          <textarea
            name="internalMemo"
            value={internalMemo}
            onChange={(e) => setInternalMemo(e.target.value)}
            rows={3}
            className={inputClassName}
            placeholder="管理者向けメモ"
          />
        </label>

        <div className="flex flex-wrap gap-2">
          <button
            type="submit"
            className="rounded-md bg-stone-800 px-4 py-2 text-sm font-medium text-white hover:bg-stone-700"
          >
            {mode === "create" ? "保存して編集画面へ" : "保存"}
          </button>
        </div>
      </form>

      <section className="rounded-2xl border border-stone-200 bg-stone-50 p-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-sm font-semibold text-stone-900">コピー用プレビュー</h2>
          <button
            type="button"
            onClick={handleCopy}
            disabled={!copyText.trim()}
            className="rounded-md border border-stone-300 bg-white px-3 py-1.5 text-xs font-medium text-stone-800 hover:bg-stone-100 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {copyState === "copied" ? "コピー済み" : copyState === "failed" ? "コピー失敗" : "投稿文をコピー"}
          </button>
        </div>
        <pre className="mt-3 max-h-64 overflow-auto whitespace-pre-wrap rounded-lg border border-stone-200 bg-white p-3 text-xs leading-relaxed text-stone-800">
          {copyText.trim() || "（文案・ハッシュタグ・リンクを入力するとここに表示されます）"}
        </pre>
      </section>
    </div>
  );
}
