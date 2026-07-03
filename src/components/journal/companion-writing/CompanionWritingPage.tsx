"use client";

import Link from "next/link";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { useFirebaseAuth } from "@/components/auth/FirebaseAuthProvider";
import { CompanionWritingAppraiserPicker } from "@/components/journal/companion-writing/CompanionWritingAppraiserPicker";
import {
  companionWritingWizardStepBodyClass,
  companionWritingWizardStepClass,
} from "@/components/journal/companion-writing/companionWritingGuideStyles";
import { MoodOwlIcon } from "@/components/journal/MoodOwlIcon";
import { TrialStatusBanner } from "@/components/entitlement/TrialStatusBanner";
import { useEntitlement } from "@/components/entitlement/useEntitlement";
import { OwlLoadingInline } from "@/components/ui/OwlLoadingInline";
import { useEnsureActiveViewerProfile } from "@/hooks/useEnsureActiveViewerProfile";
import { parseSafeJournalReturnTo } from "@/lib/journal/bookshelfReturnTo";
import { buildCompanionWritingEntryContent } from "@/lib/journal/companionWriting/buildEntryContent";
import {
  buildCompanionAcknowledgmentLine,
  pickCompanionShortLine,
} from "@/lib/journal/companionWriting/companionPrompt";
import { getAppraiserDisplayName } from "@/lib/journal/companionWriting/messages";
import {
  composeOwlGeneratedBody,
  pickOwlQuestionSet,
  type OwlQuestionSet,
} from "@/lib/journal/companionWriting/owlQuestionSets";
import {
  type CompanionWritingChoiceId,
} from "@/lib/journal/companionWriting/omakase";
import { writeCompanionWritingCalendarComplete } from "@/lib/journal/companionWriting/session";
import {
  COMPANION_WRITING_ACTIVITY_HEADING,
  COMPANION_WRITING_APPRAISER_PICK_HEADING,
  COMPANION_WRITING_APPRAISER_PICK_HINT,
  COMPANION_WRITING_AVAILABLE_COMPANION,
  COMPANION_WRITING_CONFIRM_HEADING,
  COMPANION_WRITING_FORMAL_TITLE,
  COMPANION_WRITING_MOOD_PICK_HEADING,
  COMPANION_WRITING_QUESTIONS_HEADING,
  COMPANION_WRITING_QUESTIONS_HINT,
  COMPANION_WRITING_SAVE_LOADING_LABEL,
  type CompanionWritingWizardStep,
} from "@/lib/journal/companionWriting/types";
import { COMPANION_WRITING_DEFAULT_CONTENT_FONT_MODE } from "@/lib/journal/contentFontMode";
import { diaryBookEntryCompanionImagePath } from "@/lib/journal/diaryBookEntryAssets";
import {
  journalCalendarAfterCompanionSavePath,
  journalNewEntryPath,
} from "@/lib/journal/journalNav";
import { LOG_HOUSE_BACK_LINK } from "@/lib/journal/logHouseLabels";
import {
  activityOptions,
  moodOptions,
  type ActivityId,
  type MoodId,
} from "@/lib/journal/meta";

function toDateInputValue(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function isValidDateInput(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [y, m, d] = value.split("-").map(Number);
  const probe = new Date(y, m - 1, d);
  return (
    probe.getFullYear() === y &&
    probe.getMonth() === m - 1 &&
    probe.getDate() === d
  );
}

const stepHeadingByStep: Partial<Record<CompanionWritingWizardStep, string>> = {
  mood: COMPANION_WRITING_MOOD_PICK_HEADING,
  activity: COMPANION_WRITING_ACTIVITY_HEADING,
  write: COMPANION_WRITING_QUESTIONS_HEADING,
  confirm: COMPANION_WRITING_CONFIRM_HEADING,
};

const COMPANION_WRITING_INPUT_SCROLL_OFFSET_PX = 12;

function scrollCompanionWritingInputIntoView(element: HTMLElement) {
  const alignTop = () => {
    const top =
      element.getBoundingClientRect().top +
      window.scrollY -
      COMPANION_WRITING_INPUT_SCROLL_OFFSET_PX;
    window.scrollTo({ top: Math.max(0, top), behavior: "smooth" });
  };

  alignTop();
  window.requestAnimationFrame(alignTop);
  window.setTimeout(alignTop, 300);
}

export function CompanionWritingPage() {
  const searchParams = useSearchParams();
  const { user, loading: authLoading } = useFirebaseAuth();
  const { entitlement, loading: entitlementLoading } = useEntitlement();
  const profileId = (searchParams.get("profile") ?? "").trim();
  const dateFromQuery = searchParams.get("date");
  const safeReturnTo = useMemo(
    () => parseSafeJournalReturnTo(searchParams.get("returnTo")),
    [searchParams],
  );

  const profileState = useEnsureActiveViewerProfile({
    urlProfileId: profileId || undefined,
    syncProfileToUrl: true,
  });
  const effectiveProfileId = profileState.effectiveProfileId;

  const canWriteJournal =
    entitlement?.canUseContinuedFeatures || entitlement?.canCreateFirstJournal;

  const [step, setStep] = useState<CompanionWritingWizardStep>("companion");
  const [companionChoice, setCompanionChoice] = useState<CompanionWritingChoiceId>(
    COMPANION_WRITING_AVAILABLE_COMPANION,
  );
  const [mood, setMood] = useState<MoodId>("calm");
  const [activity, setActivity] = useState<ActivityId>("record_anyway");
  const [questionSet, setQuestionSet] = useState<OwlQuestionSet | null>(null);
  const [answer1, setAnswer1] = useState("");
  const [answer2, setAnswer2] = useState("");
  const [entryDate, setEntryDate] = useState(() => toDateInputValue(new Date()));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const answer1InputRef = useRef<HTMLInputElement>(null);

  const companionType = COMPANION_WRITING_AVAILABLE_COMPANION;

  const acknowledgmentLine = useMemo(
    () => buildCompanionAcknowledgmentLine(activity),
    [activity],
  );

  const companionShortLine = useMemo(
    () => pickCompanionShortLine(companionType, mood, activity),
    [activity, companionType, mood],
  );

  const companionName = useMemo(
    () => getAppraiserDisplayName(companionType),
    [companionType],
  );

  const generatedBody = useMemo(() => {
    if (!questionSet) return "";
    return composeOwlGeneratedBody(questionSet, { answer1, answer2 });
  }, [answer1, answer2, questionSet]);

  const previewContent = useMemo(
    () =>
      buildCompanionWritingEntryContent({
        mood,
        activity,
        companionName,
        companionShortLine,
        generatedBody,
      }),
    [activity, companionName, companionShortLine, generatedBody, mood],
  );

  const companionIllustrationPath = useMemo(
    () => diaryBookEntryCompanionImagePath(companionType),
    [companionType],
  );

  useEffect(() => {
    if (!dateFromQuery || !isValidDateInput(dateFromQuery)) {
      setEntryDate(toDateInputValue(new Date()));
      return;
    }
    setEntryDate(dateFromQuery);
  }, [dateFromQuery]);

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  }, [step]);

  const handleAnswerInputFocus = useCallback((element: HTMLElement) => {
    scrollCompanionWritingInputIntoView(element);
  }, []);

  const handleCompanionChoice = useCallback((next: CompanionWritingChoiceId) => {
    if (next !== COMPANION_WRITING_AVAILABLE_COMPANION) return;
    setCompanionChoice(next);
  }, []);

  const beginQuestionStep = useCallback(() => {
    setQuestionSet(pickOwlQuestionSet(activity));
    setAnswer1("");
    setAnswer2("");
    setError(null);
    setStep("write");
  }, [activity]);

  const advanceFromCompanionStep = useCallback(() => {
    if (companionChoice !== COMPANION_WRITING_AVAILABLE_COMPANION) {
      setError("現在はフクロウ先生のみ選べます。");
      return;
    }
    setError(null);
    setStep("mood");
  }, [companionChoice]);

  const advanceToConfirmStep = useCallback(() => {
    if (!answer1.trim() || !answer2.trim()) {
      setError("2つの質問に、短い言葉で答えてみてください。");
      return;
    }
    setError(null);
    setStep("confirm");
  }, [answer1, answer2]);

  const saveEntry = useCallback(async () => {
    if (!questionSet || !answer1.trim() || !answer2.trim()) {
      setError("2つの質問に、短い言葉で答えてみてください。");
      return;
    }
    if (!canWriteJournal) {
      setError("無料お試し期間が終了したため、新しい記録の作成はできません。");
      return;
    }

    setError(null);
    setSaving(true);
    try {
      const content = buildCompanionWritingEntryContent({
        mood,
        activity,
        companionName: getAppraiserDisplayName(companionType),
        companionShortLine: pickCompanionShortLine(companionType, mood, activity),
        generatedBody: composeOwlGeneratedBody(questionSet, { answer1, answer2 }),
      });

      const res = await fetch("/api/journal", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content,
          mood,
          // 伴走の18択は保存本文に残す。通常の読み解きロジックには渡さない。
          activity: "record_anyway",
          companionType,
          designTheme: "simple_plain",
          contentFontMode: COMPANION_WRITING_DEFAULT_CONTENT_FONT_MODE,
          entryDate,
          profileId: effectiveProfileId,
          effectiveProfileId,
        }),
      });

      let data: { entry?: { id: string }; error?: string };
      try {
        data = (await res.json()) as { entry?: { id: string }; error?: string };
      } catch {
        throw new Error("サーバーからの応答を読み取れませんでした。");
      }
      if (!res.ok) {
        throw new Error(data.error ?? `保存に失敗しました。（${res.status}）`);
      }
      if (!data.entry?.id) {
        throw new Error("保存に失敗しました。日記IDを取得できませんでした。");
      }

      writeCompanionWritingCalendarComplete({
        version: 1,
        entryId: data.entry.id,
        entryDateYmd: entryDate,
        companionType,
        profileId: effectiveProfileId,
        designTheme: "simple_plain",
      });

      const calendarPath = journalCalendarAfterCompanionSavePath({
        entryDateYmd: entryDate,
        profileId: effectiveProfileId,
      });
      // 伴走保存後はフル遷移でカレンダー完了導線へ（開発中のクライアントルータ不調を避ける）
      window.location.assign(calendarPath);
    } catch (e) {
      setError(e instanceof Error ? e.message : "保存に失敗しました。");
      setSaving(false);
    }
  }, [
    activity,
    answer1,
    answer2,
    canWriteJournal,
    companionType,
    effectiveProfileId,
    entryDate,
    mood,
    questionSet,
  ]);

  if (authLoading || entitlementLoading || !profileState.ready) {
    return (
      <div className="mx-auto flex max-w-lg justify-center px-4 py-16">
        <OwlLoadingInline label="準備しています…" size="md" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="mx-auto max-w-lg space-y-3 px-4 py-8">
        <h1 className="text-xl font-bold text-stone-900">{COMPANION_WRITING_FORMAL_TITLE}</h1>
        <p className="text-sm text-stone-700">日記を書くにはログインが必要です。</p>
        <Link href="/login" className="text-sm font-medium text-emerald-900 underline-offset-2 hover:underline">
          ログインする
        </Link>
      </div>
    );
  }

  if (!canWriteJournal) {
    return (
      <div className="mx-auto max-w-lg space-y-3 px-4 py-8">
        <h1 className="text-xl font-bold text-stone-900">{COMPANION_WRITING_FORMAL_TITLE}</h1>
        <p className="rounded-lg border border-violet-200 bg-violet-50/70 px-4 py-3 text-sm text-violet-950">
          無料お試し期間が終了したため、新しい日記の作成はできません。
        </p>
        <Link
          href="/orders/calendar"
          className="text-sm font-medium text-emerald-900 underline-offset-2 hover:underline"
        >
          カレンダーで過去の日記を見る
        </Link>
      </div>
    );
  }

  return (
    <div className="relative mx-auto max-w-lg space-y-5 px-5 py-5 sm:space-y-4 sm:px-4 sm:py-8">
      {(step === "write" || step === "confirm") && saving ? (
        <div
          className="fixed inset-0 z-[70] flex items-center justify-center bg-[#faf8f5]/92 backdrop-blur-[2px]"
          aria-live="polite"
          aria-busy="true"
          role="status"
        >
          <OwlLoadingInline
            label={COMPANION_WRITING_SAVE_LOADING_LABEL}
            size="md"
            className="rounded-xl border border-stone-200 bg-white px-5 py-4 text-sm text-stone-700 shadow-sm"
          />
        </div>
      ) : null}
      <header className="space-y-2">
        <p className="text-sm">
          <Link
            href={safeReturnTo ?? LOG_HOUSE_BACK_LINK.href}
            className="text-stone-500 underline-offset-2 hover:text-stone-800 hover:underline"
          >
            {safeReturnTo ? "戻る" : LOG_HOUSE_BACK_LINK.label}
          </Link>
        </p>
        {step === "companion" ? (
          <>
            <p className="text-xs leading-snug text-stone-500">
              プロフィール：
              <span className="font-medium text-stone-700">
                {profileState.activeProfileNickname}
              </span>
            </p>
            {entitlement ? <TrialStatusBanner entitlement={entitlement} /> : null}
            <div>
              <h1 className="text-xl font-bold leading-snug text-stone-900 sm:text-2xl">
                {COMPANION_WRITING_APPRAISER_PICK_HEADING}
              </h1>
              <p className="mt-1.5 text-sm leading-relaxed text-stone-600">
                {COMPANION_WRITING_APPRAISER_PICK_HINT}
              </p>
            </div>
          </>
        ) : step === "mood" || step === "activity" || step === "write" || step === "confirm" ? (
          <>
            <p className="text-xs leading-snug text-stone-500">
              プロフィール：
              <span className="font-medium text-stone-700">
                {profileState.activeProfileNickname}
              </span>
            </p>
            <h1 className="text-xl font-bold leading-snug text-stone-900 sm:text-2xl">
              {stepHeadingByStep[step]}
            </h1>
          </>
        ) : null}
      </header>

      {step === "companion" ? (
        <section className={companionWritingWizardStepClass}>
          <CompanionWritingAppraiserPicker
            selected={companionChoice}
            onSelect={handleCompanionChoice}
          />
          <button
            type="button"
            onClick={advanceFromCompanionStep}
            className="min-h-[44px] w-full rounded-lg bg-emerald-800 px-4 py-2.5 text-sm font-medium text-white hover:bg-emerald-900"
          >
            つぎへ
          </button>
          <div className="space-y-1 pt-1 text-center">
            <p className="text-xs text-stone-500">いつもどおり書く方はこちら</p>
            <Link
              href={journalNewEntryPath(
                entryDate,
                safeReturnTo ?? "/orders",
                effectiveProfileId,
              )}
              className="text-sm font-medium text-emerald-900 underline-offset-2 hover:underline"
            >
              通常の日記入力へ
            </Link>
          </div>
        </section>
      ) : null}

      {step === "mood" ? (
        <section className={companionWritingWizardStepClass}>
          <fieldset>
            <legend className="sr-only">今日の気分</legend>
            <div
              className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 sm:gap-2"
              role="radiogroup"
              aria-label="今日の気分"
            >
              {moodOptions.map((option) => {
                const selected = mood === option.id;
                return (
                  <button
                    key={option.id}
                    type="button"
                    role="radio"
                    aria-checked={selected}
                    onClick={() => setMood(option.id)}
                    className={[
                      "flex flex-col items-center gap-1.5 rounded-lg border px-2 py-3 text-center transition sm:py-2.5",
                      selected
                        ? "border-emerald-500 bg-emerald-50 ring-2 ring-emerald-300"
                        : "border-stone-200 bg-white hover:border-stone-300 hover:bg-stone-50",
                    ].join(" ")}
                  >
                    <MoodOwlIcon moodId={option.id} sizePx={40} />
                    <span className="text-sm font-medium text-stone-800">{option.label}</span>
                  </button>
                );
              })}
            </div>
          </fieldset>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setStep("companion")}
              className="min-h-[44px] flex-1 rounded-lg border border-stone-300 bg-white px-4 py-2.5 text-sm font-medium text-stone-700 hover:bg-stone-50"
            >
              もどる
            </button>
            <button
              type="button"
              onClick={() => setStep("activity")}
              className="min-h-[44px] flex-[2] rounded-lg bg-emerald-800 px-4 py-2.5 text-sm font-medium text-white hover:bg-emerald-900"
            >
              つぎへ
            </button>
          </div>
        </section>
      ) : null}

      {step === "activity" ? (
        <section className={companionWritingWizardStepClass}>
          <p className={`mb-3 ${companionWritingWizardStepBodyClass}`}>
            いちばん近いものを選んでください。
          </p>
          <label className="sr-only" htmlFor="companion-writing-activity">
            {COMPANION_WRITING_ACTIVITY_HEADING}
          </label>
          <select
            id="companion-writing-activity"
            value={activity}
            onChange={(e) => setActivity(e.target.value as ActivityId)}
            className="w-full rounded-lg border border-stone-300 bg-white px-3 py-2.5 text-base text-stone-900 outline-none ring-emerald-500 focus:ring-2 sm:text-sm"
          >
            {activityOptions.map((option) => (
              <option key={option.id} value={option.id}>
                {option.label}
              </option>
            ))}
          </select>
          <div className="flex gap-2 pt-1">
            <button
              type="button"
              onClick={() => setStep("mood")}
              className="min-h-[44px] flex-1 rounded-lg border border-stone-300 bg-white px-4 py-2.5 text-sm font-medium text-stone-700 hover:bg-stone-50"
            >
              もどる
            </button>
            <button
              type="button"
              onClick={beginQuestionStep}
              className="min-h-[44px] flex-[2] rounded-lg bg-emerald-800 px-4 py-2.5 text-sm font-medium text-white hover:bg-emerald-900"
            >
              つぎへ
            </button>
          </div>
        </section>
      ) : null}

      {step === "write" && questionSet ? (
        <section className={companionWritingWizardStepClass}>
          {error ? (
            <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-800" role="alert">
              {error}
            </p>
          ) : null}
          <p className={`leading-relaxed text-stone-800 ${companionWritingWizardStepBodyClass}`}>
            {acknowledgmentLine}
          </p>
          <div className="flex items-start gap-3 rounded-lg border border-emerald-100 bg-emerald-50/60 px-3 py-3.5 sm:px-4 sm:py-3">
            <Image
              src={companionIllustrationPath}
              alt=""
              width={682}
              height={1024}
              sizes="64px"
              className="h-20 w-14 shrink-0 object-contain object-bottom sm:h-24 sm:w-16"
            />
            <div className="min-w-0 space-y-1">
              <p className="text-sm font-medium text-stone-800">{companionName}：</p>
              <p className="text-base leading-7 text-stone-800 sm:text-sm">
                「{companionShortLine}」
              </p>
            </div>
          </div>
          <p className={companionWritingWizardStepBodyClass}>{COMPANION_WRITING_QUESTIONS_HINT}</p>
          <label className="block space-y-2" htmlFor="companion-writing-answer-1">
            <span className="text-sm font-medium leading-relaxed text-stone-800">
              {questionSet.q1}
            </span>
            <input
              ref={answer1InputRef}
              id="companion-writing-answer-1"
              type="text"
              value={answer1}
              onChange={(e) => setAnswer1(e.target.value)}
              onFocus={(e) => handleAnswerInputFocus(e.currentTarget)}
              disabled={saving}
              placeholder="短い言葉で大丈夫です"
              className="w-full scroll-mt-3 rounded-lg border border-stone-300 px-3 py-2.5 text-base leading-relaxed text-stone-900 outline-none ring-emerald-500 focus:ring-2"
            />
          </label>
          <label className="block space-y-2" htmlFor="companion-writing-answer-2">
            <span className="text-sm font-medium leading-relaxed text-stone-800">
              {questionSet.q2}
            </span>
            <input
              id="companion-writing-answer-2"
              type="text"
              value={answer2}
              onChange={(e) => setAnswer2(e.target.value)}
              onFocus={(e) => handleAnswerInputFocus(e.currentTarget)}
              disabled={saving}
              placeholder="短い言葉で大丈夫です"
              className="w-full scroll-mt-3 rounded-lg border border-stone-300 px-3 py-2.5 text-base leading-relaxed text-stone-900 outline-none ring-emerald-500 focus:ring-2"
            />
          </label>
          <div className="flex gap-2">
            <button
              type="button"
              disabled={saving}
              onClick={() => setStep("activity")}
              className="min-h-[44px] flex-1 rounded-lg border border-stone-300 bg-white px-4 py-2.5 text-sm font-medium text-stone-700 hover:bg-stone-50 disabled:opacity-60"
            >
              もどる
            </button>
            <button
              type="button"
              disabled={saving}
              onClick={advanceToConfirmStep}
              className="min-h-[44px] flex-[2] rounded-lg bg-emerald-800 px-4 py-2.5 text-sm font-medium text-white hover:bg-emerald-900 disabled:opacity-60"
            >
              つぎへ
            </button>
          </div>
        </section>
      ) : null}

      {step === "confirm" ? (
        <section className={companionWritingWizardStepClass}>
          {error ? (
            <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-800" role="alert">
              {error}
            </p>
          ) : null}
          <div className="rounded-xl border border-stone-200 bg-[#faf8f5] px-4 py-4">
            <p className="whitespace-pre-wrap break-words text-base leading-relaxed text-stone-800">
              {previewContent}
            </p>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              disabled={saving}
              onClick={() => setStep("write")}
              className="min-h-[44px] flex-1 rounded-lg border border-stone-300 bg-white px-4 py-2.5 text-sm font-medium text-stone-700 hover:bg-stone-50 disabled:opacity-60"
            >
              もどる
            </button>
            <button
              type="button"
              disabled={saving}
              onClick={() => void saveEntry()}
              className="min-h-[44px] flex-[2] rounded-lg bg-emerald-800 px-4 py-2.5 text-sm font-medium text-white hover:bg-emerald-900 disabled:opacity-60"
            >
              {saving ? "保存中…" : "今日のあしあとを残す"}
            </button>
          </div>
        </section>
      ) : null}

      {error && step !== "write" && step !== "confirm" ? (
        <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-800" role="alert">
          {error}
        </p>
      ) : null}

      {step !== "companion" ? (
        <p className="text-center text-xs text-stone-500">
          いつもどおり書きたい方は
          <Link
            href={journalNewEntryPath(
              entryDate,
              safeReturnTo ?? "/orders",
              effectiveProfileId,
            )}
            className="mx-1 text-emerald-900 underline-offset-2 hover:underline"
          >
            通常の日記入力
          </Link>
          からも始められます。
        </p>
      ) : null}
    </div>
  );
}
