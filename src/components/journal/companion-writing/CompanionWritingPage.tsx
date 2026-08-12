"use client";

import Link from "next/link";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { useFirebaseAuth } from "@/components/auth/FirebaseAuthProvider";
import { CompanionWritingAppraiserPicker } from "@/components/journal/companion-writing/CompanionWritingAppraiserPicker";
import { DiaryTagInput } from "@/components/journal/DiaryTagInput";
import {
  companionWritingWizardStepBodyClass,
  companionWritingWizardStepClass,
} from "@/components/journal/companion-writing/companionWritingGuideStyles";
import { DonguriFootprintModal } from "@/components/loghouse/DonguriFootprintModal";
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
  ensureOmakaseCompanionResolved,
  isOmakaseChoice,
  type CompanionWritingChoiceId,
} from "@/lib/journal/companionWriting/omakase";
import { writeCompanionWritingCalendarComplete } from "@/lib/journal/companionWriting/session";
import {
  COMPANION_WRITING_ACTIVITY_HEADING,
  COMPANION_WRITING_APPRAISER_PICK_HEADING,
  COMPANION_WRITING_APPRAISER_PICK_HINT,
  COMPANION_WRITING_CONFIRM_HEADING,
  COMPANION_WRITING_FORMAL_TITLE,
  COMPANION_WRITING_MOOD_PICK_HEADING,
  companionWritingQuestionsHeading,
  COMPANION_WRITING_QUESTIONS_HINT,
  companionWritingSaveLoadingLabel,
  type CompanionWritingWizardStep,
} from "@/lib/journal/companionWriting/types";
import { COMPANION_WRITING_DEFAULT_CONTENT_FONT_MODE } from "@/lib/journal/contentFontMode";
import { mergeTagsIntoContent } from "@/lib/journal/diaryTags";
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
  type CompanionType,
  type MoodId,
} from "@/lib/journal/meta";
import {
  BTN_BACK,
  BTN_CLOSE,
  BTN_DRAFT_SAVE,
  BTN_FOOTPRINT_CONFIRM,
  BTN_FOOTPRINT_SAVE,
  BTN_MAKE_DRAFT,
  BTN_VIEW_DONGURI,
  DONGURI_FOOTPRINT_CONFIRM_BODY,
  DONGURI_FOOTPRINT_CONFIRM_TITLE,
  DONGURI_SHORTAGE_SAVE_BODY,
  DONGURI_SHORTAGE_SAVE_TITLE,
} from "@/lib/loghouse/donguriFootprintCopy";
import { writeDonguriBalanceHint } from "@/lib/loghouse/donguriBalanceHint";
import { DONGURI_DIARY_SAVE_COST, DONGURI_PAGE_PATH } from "@/lib/loghouse/donguriTypes";

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
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, loading: authLoading } = useFirebaseAuth();
  const { entitlement, loading: entitlementLoading } = useEntitlement();
  const profileId = (searchParams.get("profile") ?? "").trim();
  const dateFromQuery = searchParams.get("date");
  const preferDraftFromQuery = searchParams.get("preferDraft") === "1";
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
  const [companionChoice, setCompanionChoice] = useState<CompanionWritingChoiceId>("owl");
  const [omakaseResolved, setOmakaseResolved] = useState<CompanionType | null>(null);
  const [mood, setMood] = useState<MoodId>("calm");
  const [activity, setActivity] = useState<ActivityId>("record_anyway");
  const [questionSet, setQuestionSet] = useState<OwlQuestionSet | null>(null);
  const [answer1, setAnswer1] = useState("");
  const [answer2, setAnswer2] = useState("");
  const [entryDate, setEntryDate] = useState(() => toDateInputValue(new Date()));
  const [tagInput, setTagInput] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [acornBalance, setAcornBalance] = useState<number | null>(null);
  const [preferDraftMode, setPreferDraftMode] = useState(preferDraftFromQuery);
  const [saveDialog, setSaveDialog] = useState<"none" | "confirm" | "shortage">("none");
  const answer1InputRef = useRef<HTMLInputElement>(null);

  const companionType = useMemo((): CompanionType => {
    if (isOmakaseChoice(companionChoice)) {
      return omakaseResolved ?? "owl";
    }
    return companionChoice;
  }, [companionChoice, omakaseResolved]);

  const saveLoadingLabel = useMemo(
    () => companionWritingSaveLoadingLabel(getAppraiserDisplayName(companionType)),
    [companionType],
  );

  const writeStepHeading = useMemo(
    () => companionWritingQuestionsHeading(getAppraiserDisplayName(companionType)),
    [companionType],
  );

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
    setPreferDraftMode(preferDraftFromQuery);
  }, [preferDraftFromQuery]);

  useEffect(() => {
    if (!effectiveProfileId) return;
    let cancelled = false;
    void (async () => {
      try {
        const qs = new URLSearchParams({ profileId: effectiveProfileId });
        const res = await fetch(`/api/loghouse/donguri/status?${qs.toString()}`, {
          credentials: "same-origin",
        });
        const data = (await res.json()) as { balance?: number };
        if (cancelled || typeof data.balance !== "number") return;
        setAcornBalance(data.balance);
        if (data.balance < DONGURI_DIARY_SAVE_COST) setPreferDraftMode(true);
      } catch {
        // ignore
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [effectiveProfileId]);

  useEffect(() => {
    if (step !== "write" || questionSet) return;
    setQuestionSet(pickOwlQuestionSet(activity));
  }, [activity, questionSet, step]);

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  }, [step]);

  const handleAnswerInputFocus = useCallback((element: HTMLElement) => {
    scrollCompanionWritingInputIntoView(element);
  }, []);

  const handleCompanionChoice = useCallback((next: CompanionWritingChoiceId) => {
    setCompanionChoice(next);
    if (!isOmakaseChoice(next)) {
      setOmakaseResolved(null);
    }
  }, []);

  const beginQuestionStep = useCallback(() => {
    setQuestionSet(pickOwlQuestionSet(activity));
    setAnswer1("");
    setAnswer2("");
    setError(null);
    setStep("write");
  }, [activity]);

  const advanceFromCompanionStep = useCallback(() => {
    if (isOmakaseChoice(companionChoice)) {
      const resolved = ensureOmakaseCompanionResolved(companionChoice, omakaseResolved);
      setOmakaseResolved(resolved);
    } else {
      setOmakaseResolved(null);
    }
    setError(null);
    setStep("mood");
  }, [companionChoice, omakaseResolved]);

  const resolveCompanionTypeForSave = useCallback((): CompanionType => {
    if (!isOmakaseChoice(companionChoice)) return companionChoice;
    const resolved = ensureOmakaseCompanionResolved(companionChoice, omakaseResolved);
    if (resolved !== omakaseResolved) {
      setOmakaseResolved(resolved);
    }
    return resolved;
  }, [companionChoice, omakaseResolved]);

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
    if (!effectiveProfileId) {
      setError("記録を確認できませんでした。ページを再読み込みしてください。");
      return;
    }
    if (!isValidDateInput(entryDate)) {
      setError("記録日を正しく入力してください。");
      return;
    }

    const resolvedCompanionType = resolveCompanionTypeForSave();
    const resolvedCompanionName = getAppraiserDisplayName(resolvedCompanionType);

    const content = mergeTagsIntoContent(
      buildCompanionWritingEntryContent({
        mood,
        activity,
        companionName: resolvedCompanionName,
        companionShortLine: pickCompanionShortLine(resolvedCompanionType, mood, activity),
        generatedBody: composeOwlGeneratedBody(questionSet, { answer1, answer2 }),
      }),
      tagInput,
    );

    if (content.length > 2000) {
      setError("本文とタグを合わせて2000文字以内にしてください。");
      return;
    }

    setError(null);
    setSaving(true);
    try {
      const res = await fetch("/api/journal", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content,
          mood,
          activity,
          companionType: resolvedCompanionType,
          designTheme: "simple_plain",
          contentFontMode: COMPANION_WRITING_DEFAULT_CONTENT_FONT_MODE,
          entryDate,
          profileId: effectiveProfileId,
          effectiveProfileId,
        }),
      });

      let data: {
        entry?: { id: string };
        error?: string;
        code?: string;
        donguriBalance?: number | null;
      };
      try {
        data = (await res.json()) as {
          entry?: { id: string };
          error?: string;
          code?: string;
          donguriBalance?: number | null;
        };
      } catch {
        throw new Error("サーバーからの応答を読み取れませんでした。");
      }
      if (!res.ok) {
        if (data.code === "ACORN_INSUFFICIENT") {
          setPreferDraftMode(true);
          setSaveDialog("shortage");
          setSaving(false);
          return;
        }
        throw new Error(data.error ?? `あしあとを残せませんでした。（${res.status}）`);
      }
      if (!data.entry?.id) {
        throw new Error("保存に失敗しました。あしあとIDを取得できませんでした。");
      }

      void import("@/lib/local-first/journal/save/handleConfirmedServerJournalMirror")
        .then(({ handleConfirmedServerJournalMirror }) =>
          handleConfirmedServerJournalMirror({ serverEntryId: data.entry.id }),
        )
        .catch(() => undefined);

      if (typeof data.donguriBalance === "number") {
        writeDonguriBalanceHint(effectiveProfileId, data.donguriBalance);
        setAcornBalance(data.donguriBalance);
      }

      writeCompanionWritingCalendarComplete({
        version: 1,
        entryId: data.entry.id,
        entryDateYmd: entryDate,
        companionType: resolvedCompanionType,
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
    effectiveProfileId,
    entryDate,
    mood,
    questionSet,
    resolveCompanionTypeForSave,
    tagInput,
  ]);

  const saveServerDraft = useCallback(async () => {
    if (!questionSet || !answer1.trim() || !answer2.trim()) {
      setError("2つの質問に、短い言葉で答えてみてください。");
      return;
    }
    if (!effectiveProfileId) {
      setError("記録を確認できませんでした。ページを再読み込みしてください。");
      return;
    }
    if (!isValidDateInput(entryDate)) {
      setError("記録日を正しく入力してください。");
      return;
    }
    const resolvedCompanionType = resolveCompanionTypeForSave();
    const content = mergeTagsIntoContent(
      buildCompanionWritingEntryContent({
        mood,
        activity,
        companionName: getAppraiserDisplayName(resolvedCompanionType),
        companionShortLine: pickCompanionShortLine(resolvedCompanionType, mood, activity),
        generatedBody: composeOwlGeneratedBody(questionSet, { answer1, answer2 }),
      }),
      tagInput,
    );
    if (content.length > 2000) {
      setError("本文とタグを合わせて2000文字以内にしてください。");
      return;
    }

    setError(null);
    setSaving(true);
    try {
      const res = await fetch("/api/journal/drafts", {
        method: "PUT",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          dateKey: entryDate,
          profileId: effectiveProfileId,
          content,
          mood,
          activity,
          companionType: resolvedCompanionType,
          designTheme: "simple_plain",
          contentFontMode: COMPANION_WRITING_DEFAULT_CONTENT_FONT_MODE,
          writingMode: "with_appraiser",
        }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(data.error ?? "下書きを残せませんでした。");
      if (safeReturnTo) {
        router.push(safeReturnTo);
      } else {
        router.push("/orders/calendar");
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "下書きを残せませんでした。");
      setSaving(false);
    }
  }, [
    activity,
    answer1,
    answer2,
    effectiveProfileId,
    entryDate,
    mood,
    questionSet,
    resolveCompanionTypeForSave,
    router,
    safeReturnTo,
    tagInput,
  ]);

  const canFootprint =
    acornBalance === null ? true : acornBalance >= DONGURI_DIARY_SAVE_COST;
  const draftPrimary = preferDraftMode || !canFootprint;

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
        <p className="text-sm text-stone-700">あしあとを残すにはログインが必要です。</p>
        <Link href="/login" className="text-sm font-medium text-[#4a5440] underline-offset-2 hover:underline">
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
          無料お試し期間が終了したため、新しいあしあとの作成はできません。
        </p>
        <Link
          href="/orders/calendar"
          className="text-sm font-medium text-[#4a5440] underline-offset-2 hover:underline"
        >
          カレンダーで過去のあしあとを見る
        </Link>
      </div>
    );
  }

  return (
    <div className="relative mx-auto min-h-[100dvh] max-w-lg space-y-5 bg-[#f6f0e6] px-5 py-5 sm:space-y-4 sm:px-4 sm:py-8">
      {(step === "write" || step === "confirm") && saving ? (
        <div
          className="fixed inset-0 z-[70] flex items-center justify-center bg-[#faf8f5]/92 backdrop-blur-[2px]"
          aria-live="polite"
          aria-busy="true"
          role="status"
        >
          <OwlLoadingInline
            label={saveLoadingLabel}
            size="md"
            className="rounded-xl border border-[#e4d5c0]/95 bg-[#fdf8f0] px-5 py-4 text-sm text-[#5c4a35] shadow-[0_4px_14px_rgba(90,70,45,0.05)]"
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
            <h1 className="text-xl font-bold leading-snug text-stone-900 sm:text-2xl">
              {step === "write" ? writeStepHeading : stepHeadingByStep[step]}
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
            className="min-h-[44px] w-full rounded-lg bg-[#b8893d] px-4 py-2.5 text-sm font-medium text-white hover:bg-[#a67a32]"
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
              className="text-sm font-medium text-[#4a5440] underline-offset-2 hover:underline"
            >
              通常のあしあと入力へ
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
                        ? "border-[#a8b08f] bg-[#eef1e4] ring-2 ring-[#c5d0a8]"
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
              className="min-h-[44px] flex-1 rounded-lg border border-[#e0d2bc]/95 bg-[#faf3e8] px-4 py-2.5 text-sm font-medium text-[#5c4a35] hover:bg-[#f3ead8]"
            >
              もどる
            </button>
            <button
              type="button"
              onClick={() => setStep("activity")}
              className="min-h-[44px] flex-[2] rounded-lg bg-[#b8893d] px-4 py-2.5 text-sm font-medium text-white hover:bg-[#a67a32]"
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
            className="w-full rounded-xl border border-[#e0d2bc]/95 bg-[#fffaf4] px-3 py-2.5 text-base text-[#3f3428] outline-none ring-[#c5b089]/50 focus:ring-2 sm:text-sm"
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
              className="min-h-[44px] flex-1 rounded-lg border border-[#e0d2bc]/95 bg-[#faf3e8] px-4 py-2.5 text-sm font-medium text-[#5c4a35] hover:bg-[#f3ead8]"
            >
              もどる
            </button>
            <button
              type="button"
              onClick={beginQuestionStep}
              className="min-h-[44px] flex-[2] rounded-lg bg-[#b8893d] px-4 py-2.5 text-sm font-medium text-white hover:bg-[#a67a32]"
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
          <div className="flex items-start gap-3 rounded-lg border border-[#e4d5c0]/90 bg-[#eef1e4]/70 px-3 py-3.5 sm:px-4 sm:py-3">
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
              className="w-full scroll-mt-3 rounded-xl border border-[#e0d2bc]/95 bg-[#fffaf4] px-3 py-2.5 text-base leading-relaxed text-[#3f3428] placeholder:text-[#9a8b78] outline-none ring-[#c5b089]/50 focus:ring-2"
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
              className="w-full scroll-mt-3 rounded-xl border border-[#e0d2bc]/95 bg-[#fffaf4] px-3 py-2.5 text-base leading-relaxed text-[#3f3428] placeholder:text-[#9a8b78] outline-none ring-[#c5b089]/50 focus:ring-2"
            />
          </label>
          <div className="flex gap-2">
            <button
              type="button"
              disabled={saving}
              onClick={() => setStep("activity")}
              className="min-h-[44px] flex-1 rounded-lg border border-[#e0d2bc]/95 bg-[#faf3e8] px-4 py-2.5 text-sm font-medium text-[#5c4a35] hover:bg-[#f3ead8] disabled:opacity-60"
            >
              もどる
            </button>
            <button
              type="button"
              disabled={saving}
              onClick={advanceToConfirmStep}
              className="min-h-[44px] flex-[2] rounded-lg bg-[#b8893d] px-4 py-2.5 text-sm font-medium text-white hover:bg-[#a67a32] disabled:opacity-60"
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
          <DiaryTagInput
            value={tagInput}
            onChange={setTagInput}
            disabled={saving}
          />
          <div className="flex flex-col gap-2 border-t border-stone-100 pt-3 sm:flex-row">
            <button
              type="button"
              disabled={saving}
              onClick={() => setStep("write")}
              className="min-h-[44px] flex-1 rounded-lg border border-[#e0d2bc]/95 bg-[#faf3e8] px-4 py-2.5 text-sm font-medium text-[#5c4a35] hover:bg-[#f3ead8] disabled:opacity-60"
            >
              もどる
            </button>
            {draftPrimary ? (
              <>
                <button
                  type="button"
                  disabled={saving}
                  onClick={() => void saveServerDraft()}
                  className="min-h-[44px] flex-[2] rounded-lg bg-[#b8893d] px-4 py-2.5 text-sm font-medium text-white hover:bg-[#a67a32] disabled:opacity-60"
                >
                  {saving ? (
                    <OwlLoadingInline label={saveLoadingLabel} size="sm" />
                  ) : (
                    BTN_DRAFT_SAVE
                  )}
                </button>
                <button
                  type="button"
                  disabled={saving}
                  onClick={() => {
                    if (!canFootprint) {
                      setSaveDialog("shortage");
                      return;
                    }
                    setSaveDialog("confirm");
                  }}
                  className="min-h-[44px] flex-1 rounded-lg border border-[#e0d2bc]/95 bg-[#faf3e8] px-4 py-2.5 text-sm font-medium text-[#5c4a35] hover:bg-[#f3ead8] disabled:opacity-60"
                >
                  {BTN_FOOTPRINT_SAVE}
                </button>
              </>
            ) : (
              <>
                <button
                  type="button"
                  disabled={saving}
                  onClick={() => setSaveDialog("confirm")}
                  className="min-h-[44px] flex-[2] rounded-lg bg-[#b8893d] px-4 py-2.5 text-sm font-medium text-white hover:bg-[#a67a32] disabled:opacity-60"
                >
                  {saving ? (
                    <OwlLoadingInline label={saveLoadingLabel} size="sm" />
                  ) : (
                    BTN_FOOTPRINT_SAVE
                  )}
                </button>
                <button
                  type="button"
                  disabled={saving}
                  onClick={() => void saveServerDraft()}
                  className="min-h-[44px] flex-1 rounded-lg border border-[#e0d2bc]/95 bg-[#faf3e8] px-4 py-2.5 text-sm font-medium text-[#5c4a35] hover:bg-[#f3ead8] disabled:opacity-60"
                >
                  {BTN_DRAFT_SAVE}
                </button>
              </>
            )}
          </div>
        </section>
      ) : null}

      <DonguriFootprintModal
        open={saveDialog === "confirm"}
        title={DONGURI_FOOTPRINT_CONFIRM_TITLE}
        body={DONGURI_FOOTPRINT_CONFIRM_BODY}
        onDismiss={() => setSaveDialog("none")}
        actions={[
          {
            label: BTN_FOOTPRINT_CONFIRM,
            variant: "primary",
            onClick: () => {
              setSaveDialog("none");
              void saveEntry();
            },
          },
          {
            label: BTN_MAKE_DRAFT,
            variant: "secondary",
            onClick: () => {
              setSaveDialog("none");
              void saveServerDraft();
            },
          },
          {
            label: BTN_BACK,
            variant: "ghost",
            onClick: () => setSaveDialog("none"),
          },
        ]}
      />
      <DonguriFootprintModal
        open={saveDialog === "shortage"}
        title={DONGURI_SHORTAGE_SAVE_TITLE}
        body={DONGURI_SHORTAGE_SAVE_BODY}
        onDismiss={() => setSaveDialog("none")}
        actions={[
          {
            label: BTN_DRAFT_SAVE,
            variant: "primary",
            onClick: () => {
              setSaveDialog("none");
              void saveServerDraft();
            },
          },
          {
            label: BTN_VIEW_DONGURI,
            variant: "secondary",
            onClick: () => {
              setSaveDialog("none");
              router.push(DONGURI_PAGE_PATH);
            },
          },
          {
            label: BTN_CLOSE,
            variant: "ghost",
            onClick: () => setSaveDialog("none"),
          },
        ]}
      />

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
            className="mx-1 text-[#4a5440] underline-offset-2 hover:underline"
          >
            通常のあしあと入力
          </Link>
          からも始められます。
        </p>
      ) : null}
    </div>
  );
}
