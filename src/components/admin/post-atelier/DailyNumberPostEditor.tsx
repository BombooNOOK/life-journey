"use client";

import { useMemo, useState } from "react";

import {
  createDailyNumberPost,
  updateDailyNumberPost,
} from "@/app/admin/post-atelier/daily-number/actions";
import { formatUniversalDayBreakdown, universalDayForScheduledDate } from "@/lib/admin/post-atelier/universalDayForScheduledDate";
import { DailyNumberPostPreview } from "@/components/admin/post-atelier/DailyNumberPostPreview";
import { DailyNumberImagePreview } from "@/components/admin/post-atelier/DailyNumberImagePreview";
import { resolveDailyNumberPost } from "@/lib/admin/post-atelier/daily-number/resolveDailyNumberPost";
import {
  SOCIAL_POST_DRAFT_STATUSES,
  SOCIAL_POST_DRAFT_STATUS_LABELS,
} from "@/lib/admin/post-atelier/types";
import type {
  DailyNumberClosingVariant,
  DailyNumberCoverVariant,
  DailyNumberDraftFormValues,
} from "@/lib/admin/post-atelier/daily-number/types";
import {
  formatDailyNumberClosingVariantUsageLabel,
  pickRandomDailyNumberClosingVariant,
} from "@/lib/admin/post-atelier/daily-number/closingVariant";
import {
  DAILY_NUMBER_VARIANT_MODES,
  DAILY_NUMBER_VARIANT_MODE_LABELS,
  formatDailyNumberVariantUsageLabel,
  pickRandomDailyNumberCoverVariant,
  type DailyNumberVariantMode,
} from "@/lib/admin/post-atelier/daily-number/variantMode";
import { companionOptions } from "@/lib/journal/meta";

type Props = {
  mode: "create" | "edit";
  draftId?: string;
  initialValues: DailyNumberDraftFormValues;
};

const inputClassName =
  "w-full rounded-md border border-stone-300 px-3 py-2 text-sm text-stone-900";
const labelClassName = "block text-sm font-medium text-stone-800";

function initialResolvedVariant(values: DailyNumberDraftFormValues): DailyNumberCoverVariant | undefined {
  if (values.coverVariantMode !== "random") return undefined;
  return values.resolvedVariant ?? pickRandomDailyNumberCoverVariant();
}

function initialResolvedClosingVariant(
  values: DailyNumberDraftFormValues,
): DailyNumberClosingVariant {
  return values.resolvedClosingVariant ?? pickRandomDailyNumberClosingVariant();
}

export function DailyNumberPostEditor({ mode, draftId, initialValues }: Props) {
  const [scheduledDate, setScheduledDate] = useState(initialValues.scheduledDate);
  const [companionType, setCompanionType] = useState(initialValues.companionType);
  const [messageType] = useState(initialValues.messageType);
  const [coverVariantMode, setCoverVariantMode] = useState<DailyNumberVariantMode>(
    initialValues.coverVariantMode,
  );
  const [resolvedVariant, setResolvedVariant] = useState<DailyNumberCoverVariant | undefined>(() =>
    initialResolvedVariant(initialValues),
  );
  const [resolvedClosingVariant, setResolvedClosingVariant] = useState<DailyNumberClosingVariant>(
    () => initialResolvedClosingVariant(initialValues),
  );
  const [status, setStatus] = useState(initialValues.status);
  const [internalMemo, setInternalMemo] = useState(initialValues.internalMemo);
  const [copyState, setCopyState] = useState<"idle" | "canva" | "caption" | "failed">("idle");

  const todayNumber = useMemo(
    () => universalDayForScheduledDate(scheduledDate),
    [scheduledDate],
  );
  const breakdown = useMemo(
    () => formatUniversalDayBreakdown(scheduledDate),
    [scheduledDate],
  );

  const resolved = useMemo(
    () =>
      resolveDailyNumberPost({
        scheduledDate,
        todayNumber,
        character: companionType,
        messageType,
        coverVariantMode,
        lockedVariant: coverVariantMode === "random" ? resolvedVariant : null,
        lockedClosingVariant: resolvedClosingVariant,
      }),
    [
      scheduledDate,
      todayNumber,
      companionType,
      messageType,
      coverVariantMode,
      resolvedVariant,
      resolvedClosingVariant,
    ],
  );

  function handleCoverVariantModeChange(mode: DailyNumberVariantMode) {
    setCoverVariantMode(mode);
    if (mode === "random") {
      setResolvedVariant(pickRandomDailyNumberCoverVariant());
    } else {
      setResolvedVariant(undefined);
    }
  }

  const variantUsageLabel = resolved.ok
    ? formatDailyNumberVariantUsageLabel({
        variantMode: resolved.payload.variantMode,
        variant: resolved.payload.variant,
      })
    : `使用文体：${DAILY_NUMBER_VARIANT_MODE_LABELS[coverVariantMode]}`;

  const closingUsageLabel = resolved.ok
    ? formatDailyNumberClosingVariantUsageLabel(resolved.payload.closingVariant)
    : formatDailyNumberClosingVariantUsageLabel(resolvedClosingVariant);

  async function handleCopy(kind: "canva" | "caption") {
    if (!resolved.ok) {
      setCopyState("failed");
      return;
    }
    const text = kind === "canva" ? resolved.canvaCopyText : resolved.captionText;
    try {
      await navigator.clipboard.writeText(text);
      setCopyState(kind);
      window.setTimeout(() => setCopyState("idle"), 2000);
    } catch {
      setCopyState("failed");
    }
  }

  const saveAction = mode === "create" ? createDailyNumberPost : updateDailyNumberPost;

  return (
    <div className="space-y-6">
      <form action={saveAction} className="space-y-5 rounded-2xl border border-stone-200 bg-white p-5">
        {mode === "edit" && draftId ? <input type="hidden" name="id" value={draftId} /> : null}
        <input type="hidden" name="messageType" value={messageType} />
        <input type="hidden" name="coverVariantMode" value={coverVariantMode} />
        {coverVariantMode === "random" && resolvedVariant ? (
          <input type="hidden" name="resolvedVariant" value={resolvedVariant} />
        ) : null}
        <input type="hidden" name="resolvedClosingVariant" value={resolvedClosingVariant} />

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="space-y-1">
            <span className={labelClassName}>投稿予定日</span>
            <input
              type="date"
              name="scheduledDate"
              value={scheduledDate}
              onChange={(e) => setScheduledDate(e.target.value)}
              required
              className={inputClassName}
            />
          </label>

          <div className="space-y-1">
            <span className={labelClassName}>今日のすうじ（自動）</span>
            <div className="rounded-md border border-stone-200 bg-stone-50 px-3 py-2 text-sm">
              {todayNumber != null ? (
                <>
                  <span className="text-2xl font-semibold tabular-nums">{todayNumber}</span>
                  {breakdown ? (
                    <p className="mt-1 font-mono text-[11px] text-stone-500">{breakdown}</p>
                  ) : null}
                </>
              ) : (
                <span className="text-stone-500">予定日を入力してください</span>
              )}
            </div>
          </div>

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
            <span className={labelClassName}>文体（表紙・個別ページ）</span>
            <select
              value={coverVariantMode}
              onChange={(e) =>
                handleCoverVariantModeChange(e.target.value as DailyNumberVariantMode)
              }
              className={inputClassName}
            >
              {DAILY_NUMBER_VARIANT_MODES.map((mode) => (
                <option key={mode} value={mode}>
                  {DAILY_NUMBER_VARIANT_MODE_LABELS[mode]}
                </option>
              ))}
            </select>
          </label>

          <div className="space-y-1">
            <span className={labelClassName}>ラストページ</span>
            <div className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-950">
              {closingUsageLabel}
            </div>
            <button
              type="button"
              onClick={() => setResolvedClosingVariant(pickRandomDailyNumberClosingVariant())}
              className="text-xs font-medium text-emerald-800 underline hover:text-emerald-950"
            >
              別のラストページを抽選
            </button>
          </div>

          <label className="space-y-1">
            <span className={labelClassName}>メッセージタイプ</span>
            <input
              type="text"
              readOnly
              value="base（初期実装）"
              className={`${inputClassName} bg-stone-50 text-stone-600`}
            />
          </label>

          <div className="space-y-1">
            <span className={labelClassName}>現在の選択</span>
            <div className="rounded-md border border-violet-200 bg-violet-50 px-3 py-2 text-sm font-medium text-violet-950">
              {variantUsageLabel}
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

          <label className="space-y-1 sm:col-span-2">
            <span className={labelClassName}>運用メモ（非公開）</span>
            <textarea
              name="internalMemo"
              value={internalMemo}
              onChange={(e) => setInternalMemo(e.target.value)}
              rows={2}
              className={inputClassName}
            />
          </label>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="submit"
            className="rounded-md bg-violet-800 px-4 py-2 text-sm font-medium text-white hover:bg-violet-700"
          >
            {mode === "create" ? "生成して保存" : "再生成して保存"}
          </button>
        </div>
      </form>

      {!resolved.ok ? (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950">
          <p className="font-medium">この今日のすうじのデータは準備中です</p>
          <p className="mt-2 leading-relaxed">
            現在はフクロウ先生 × base の UD1〜9（文体 A/B/C）のみプレビュー・保存できます。
            {todayNumber != null ? (
              <>
                <br />
                選択中の予定日の今日のすうじは <strong>{todayNumber}</strong> です。
              </>
            ) : null}
          </p>
        </div>
      ) : (
        <>
          <div className="rounded-xl border border-emerald-200 bg-emerald-50/60 px-4 py-3 text-sm font-medium text-emerald-950">
            {closingUsageLabel}
          </div>

          <div className="rounded-xl border border-violet-200 bg-violet-50/60 px-4 py-3 text-sm font-medium text-violet-950">
            {formatDailyNumberVariantUsageLabel({
              variantMode: resolved.payload.variantMode,
              variant: resolved.payload.variant,
            })}
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => handleCopy("canva")}
              className="rounded-md border border-stone-300 bg-white px-3 py-1.5 text-xs font-medium text-stone-800 hover:bg-stone-50"
            >
              {copyState === "canva" ? "Canva用コピー済み" : "Canva貼り付け用をコピー"}
            </button>
            <button
              type="button"
              onClick={() => handleCopy("caption")}
              className="rounded-md border border-stone-300 bg-white px-3 py-1.5 text-xs font-medium text-stone-800 hover:bg-stone-50"
            >
              {copyState === "caption" ? "キャプションコピー済み" : "Instagramキャプションをコピー"}
            </button>
            {copyState === "failed" ? (
              <span className="text-xs text-red-600">コピーに失敗しました</span>
            ) : null}
          </div>

          <DailyNumberPostPreview payload={resolved.payload} />

          {mode === "edit" && draftId ? (
            <DailyNumberImagePreview draftId={draftId} />
          ) : null}

          <section className="grid gap-4 lg:grid-cols-2">
            <div className="rounded-xl border border-stone-200 bg-stone-50 p-4">
              <h3 className="text-sm font-semibold text-stone-900">Canva貼り付け用（プレビュー）</h3>
              <pre className="mt-3 max-h-64 overflow-auto whitespace-pre-wrap text-xs leading-relaxed text-stone-800">
                {resolved.canvaCopyText}
              </pre>
            </div>
            <div className="rounded-xl border border-stone-200 bg-stone-50 p-4">
              <h3 className="text-sm font-semibold text-stone-900">Instagramキャプション（プレビュー）</h3>
              <pre className="mt-3 max-h-64 overflow-auto whitespace-pre-wrap text-xs leading-relaxed text-stone-800">
                {resolved.captionText}
              </pre>
            </div>
          </section>
        </>
      )}
    </div>
  );
}
