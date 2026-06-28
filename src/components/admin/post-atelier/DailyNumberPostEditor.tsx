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
import { formatDailyNumberMessageFallbackNotice } from "@/lib/admin/post-atelier/daily-number/messagePublishPolicy";
import { dailyNumberZipBasename } from "@/lib/admin/post-atelier/daily-number/zipBasename";
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
  DAILY_NUMBER_MESSAGE_SEASON_MODES,
  DAILY_NUMBER_MESSAGE_SEASON_MODE_LABELS,
  formatDailyNumberMessageSeasonUsageLabel,
  pickRandomDailyNumberMessageSeason,
  summerMessageSeasonRequiresVariantA,
  type DailyNumberMessageSeasonMode,
} from "@/lib/admin/post-atelier/daily-number/messageSeasonMode";
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

function editorCoverVariant(values: DailyNumberDraftFormValues): DailyNumberCoverVariant {
  if (values.coverVariantMode !== "random") {
    return values.coverVariantMode;
  }
  return values.resolvedVariant ?? pickRandomDailyNumberCoverVariant();
}

function initialLockedMessageSeason(
  values: DailyNumberDraftFormValues,
  todayNumber: number | null,
): import("@/lib/admin/post-atelier/daily-number/types").DailyNumberCoverSeason | undefined {
  if (values.messageSeasonMode !== "random") return undefined;
  if (values.lockedMessageSeason) return values.lockedMessageSeason;
  if (todayNumber == null) return "base";
  return pickRandomDailyNumberMessageSeason(
    todayNumber as import("@/lib/admin/post-atelier/daily-number/types").DailyNumberTodayValue,
    editorCoverVariant(values),
  );
}

export function DailyNumberPostEditor({ mode, draftId, initialValues }: Props) {
  const [scheduledDate, setScheduledDate] = useState(initialValues.scheduledDate);
  const [companionType, setCompanionType] = useState(initialValues.companionType);
  const [messageType] = useState(initialValues.messageType);
  const [coverVariantMode, setCoverVariantMode] = useState<DailyNumberVariantMode>(
    initialValues.coverVariantMode,
  );
  const [messageSeasonMode, setMessageSeasonMode] = useState<DailyNumberMessageSeasonMode>(
    initialValues.messageSeasonMode ?? "base",
  );
  const [resolvedVariant, setResolvedVariant] = useState<DailyNumberCoverVariant | undefined>(() =>
    initialResolvedVariant(initialValues),
  );
  const [lockedMessageSeason, setLockedMessageSeason] = useState<
    import("@/lib/admin/post-atelier/daily-number/types").DailyNumberCoverSeason | undefined
  >(() =>
    initialLockedMessageSeason(
      initialValues,
      universalDayForScheduledDate(initialValues.scheduledDate),
    ),
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

  const effectiveVariant = useMemo((): DailyNumberCoverVariant => {
    if (coverVariantMode !== "random") return coverVariantMode;
    return resolvedVariant ?? pickRandomDailyNumberCoverVariant();
  }, [coverVariantMode, resolvedVariant]);

  const resolved = useMemo(
    () =>
      resolveDailyNumberPost({
        scheduledDate,
        todayNumber,
        character: companionType,
        messageType,
        coverVariantMode,
        messageSeasonMode,
        lockedVariant: coverVariantMode === "random" ? resolvedVariant : null,
        lockedMessageSeason: messageSeasonMode === "random" ? lockedMessageSeason : null,
        lockedClosingVariant: resolvedClosingVariant,
      }),
    [
      scheduledDate,
      todayNumber,
      companionType,
      messageType,
      coverVariantMode,
      messageSeasonMode,
      resolvedVariant,
      lockedMessageSeason,
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

  function handleMessageSeasonModeChange(mode: DailyNumberMessageSeasonMode) {
    setMessageSeasonMode(mode);
    if (mode === "random" && todayNumber != null) {
      setLockedMessageSeason(
        pickRandomDailyNumberMessageSeason(
          todayNumber as import("@/lib/admin/post-atelier/daily-number/types").DailyNumberTodayValue,
          effectiveVariant,
        ),
      );
    } else {
      setLockedMessageSeason(undefined);
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

  const messageSeasonUsageLabel = resolved.ok
    ? formatDailyNumberMessageSeasonUsageLabel({
        messageSeasonMode: resolved.payload.messageSeasonMode,
        messageSeason: resolved.payload.messageSeason,
      })
    : `個別文案：${DAILY_NUMBER_MESSAGE_SEASON_MODE_LABELS[messageSeasonMode]}`;

  const summerVariantNote =
    resolved.ok &&
    summerMessageSeasonRequiresVariantA(
      resolved.payload.messageSeasonMode,
      resolved.payload.variant,
    )
      ? "夏の森の個別文案は文体 A のみ入稿済みです。B/C では個別ページは通常文案になります。"
      : null;

  async function copyTextToClipboard(text: string): Promise<boolean> {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      try {
        const textarea = document.createElement("textarea");
        textarea.value = text;
        textarea.setAttribute("readonly", "");
        textarea.style.position = "fixed";
        textarea.style.left = "-9999px";
        document.body.appendChild(textarea);
        textarea.select();
        const ok = document.execCommand("copy");
        document.body.removeChild(textarea);
        return ok;
      } catch {
        return false;
      }
    }
  }

  async function handleCopy(kind: "canva" | "caption") {
    if (!resolved.ok) {
      setCopyState("failed");
      return;
    }
    const text = kind === "canva" ? resolved.canvaCopyText : resolved.captionText;
    const ok = await copyTextToClipboard(text);
    if (!ok) {
      setCopyState("failed");
      return;
    }
    setCopyState(kind);
    window.setTimeout(() => setCopyState("idle"), 2000);
  }

  const saveAction = mode === "create" ? createDailyNumberPost : updateDailyNumberPost;

  return (
    <div className="space-y-6">
      <form action={saveAction} className="space-y-5 rounded-2xl border border-stone-200 bg-white p-5">
        {mode === "edit" && draftId ? <input type="hidden" name="id" value={draftId} /> : null}
        <input type="hidden" name="messageType" value={messageType} />
        <input type="hidden" name="coverVariantMode" value={coverVariantMode} />
        <input type="hidden" name="messageSeasonMode" value={messageSeasonMode} />
        {coverVariantMode === "random" && resolvedVariant ? (
          <input type="hidden" name="resolvedVariant" value={resolvedVariant} />
        ) : null}
        {messageSeasonMode === "random" && lockedMessageSeason ? (
          <input type="hidden" name="lockedMessageSeason" value={lockedMessageSeason} />
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

          <label className="space-y-1">
            <span className={labelClassName}>個別文案（季節・通常）</span>
            <select
              value={messageSeasonMode}
              onChange={(e) =>
                handleMessageSeasonModeChange(e.target.value as DailyNumberMessageSeasonMode)
              }
              className={inputClassName}
            >
              {DAILY_NUMBER_MESSAGE_SEASON_MODES.map((mode) => (
                <option key={mode} value={mode}>
                  {DAILY_NUMBER_MESSAGE_SEASON_MODE_LABELS[mode]}
                </option>
              ))}
            </select>
          </label>

          <div className="space-y-1">
            <span className={labelClassName}>個別文案の選択結果</span>
            <div className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm font-medium text-amber-950">
              {messageSeasonUsageLabel}
            </div>
            {messageSeasonMode === "random" && todayNumber != null ? (
              <button
                type="button"
                onClick={() =>
                  setLockedMessageSeason(
                    pickRandomDailyNumberMessageSeason(
                      todayNumber as import("@/lib/admin/post-atelier/daily-number/types").DailyNumberTodayValue,
                      effectiveVariant,
                    ),
                  )
                }
                className="text-xs font-medium text-amber-900 underline hover:text-amber-950"
              >
                別の季節文案を抽選
              </button>
            ) : null}
            {summerVariantNote ? (
              <p className="text-xs leading-relaxed text-amber-900">{summerVariantNote}</p>
            ) : null}
          </div>

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
            disabled={resolved.ok && !resolved.publishReady}
            className="rounded-md bg-violet-800 px-4 py-2 text-sm font-medium text-white hover:bg-violet-700 disabled:cursor-not-allowed disabled:bg-stone-400"
          >
            {mode === "create" ? "生成して保存" : "再生成して保存"}
          </button>
        </div>
      </form>

      {!resolved.ok ? (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950">
          <p className="font-medium">この今日のすうじのデータは準備中です</p>
          <p className="mt-2 leading-relaxed">
            今日のすうじ × base の表紙文案・個別ページデータが揃っていません。
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
          {!resolved.publishReady ? (
            <div className="rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-950">
              <p className="font-medium">プレビューのみ（保存・ZIP不可）</p>
              <p className="mt-2 leading-relaxed">
                {formatDailyNumberMessageFallbackNotice(companionType)}
              </p>
            </div>
          ) : null}

          <div className="rounded-xl border border-emerald-200 bg-emerald-50/60 px-4 py-3 text-sm font-medium text-emerald-950">
            {closingUsageLabel}
          </div>

          <div className="rounded-xl border border-amber-200 bg-amber-50/60 px-4 py-3 text-sm font-medium text-amber-950">
            {messageSeasonUsageLabel}
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
            {copyState === "failed" ? (
              <span className="text-xs text-red-600">コピーに失敗しました</span>
            ) : null}
          </div>

          <DailyNumberPostPreview payload={resolved.payload} />

          {mode === "edit" && draftId ? (
            <DailyNumberImagePreview
              draftId={draftId}
              publishReady={resolved.publishReady}
              suggestedZipFileName={dailyNumberZipBasename(resolved.payload)}
            />
          ) : null}

          <section className="grid gap-4 lg:grid-cols-2">
            <div className="rounded-xl border border-stone-200 bg-stone-50 p-4">
              <h3 className="text-sm font-semibold text-stone-900">Canva貼り付け用（プレビュー）</h3>
              <pre className="mt-3 max-h-64 overflow-auto whitespace-pre-wrap text-xs leading-relaxed text-stone-800">
                {resolved.canvaCopyText}
              </pre>
            </div>
            <button
              type="button"
              onClick={() => handleCopy("caption")}
              aria-label="Instagramキャプションを全文コピー"
              className={[
                "w-full rounded-xl border p-4 text-left transition",
                copyState === "caption"
                  ? "border-emerald-400 bg-emerald-50/70"
                  : "border-stone-200 bg-stone-50 hover:border-emerald-300 hover:bg-emerald-50/40 active:bg-emerald-50/60",
              ].join(" ")}
            >
              <div className="flex items-start justify-between gap-3">
                <h3 className="text-sm font-semibold text-stone-900">Instagramキャプション</h3>
                <span className="shrink-0 rounded-full bg-emerald-100 px-2.5 py-1 text-[11px] font-semibold text-emerald-900">
                  {copyState === "caption" ? "コピーしました" : "タップで全文コピー"}
                </span>
              </div>
              <pre className="pointer-events-none mt-3 max-h-64 overflow-auto whitespace-pre-wrap text-xs leading-relaxed text-stone-800">
                {resolved.captionText}
              </pre>
            </button>
          </section>
        </>
      )}
    </div>
  );
}
