"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";

import { useFirebaseAuth } from "@/components/auth/FirebaseAuthProvider";
import { MoodOwlIcon } from "@/components/journal/MoodOwlIcon";
import { ActiveProfileLabel } from "@/components/profile/ActiveProfileLabel";
import { TrialStatusBanner } from "@/components/entitlement/TrialStatusBanner";
import { useEntitlement } from "@/components/entitlement/useEntitlement";
import { useEnsureActiveViewerProfile } from "@/hooks/useEnsureActiveViewerProfile";
import { parseSafeJournalReturnTo } from "@/lib/journal/bookshelfReturnTo";
import { buildCompanionWritingEntryContent } from "@/lib/journal/companionWriting/buildEntryContent";
import { fetchCompanionWritingReadingFirstSentence } from "@/lib/journal/companionWriting/readingFirstSentence";
import {
  getAppraiserDisplayName,
  getCompanionFollowUpQuestion,
  getCompanionOpeningMessage,
} from "@/lib/journal/companionWriting/messages";
import {
  COMPANION_WRITING_OMAKASE_ID,
  isOmakaseChoice,
  pickOmakaseCompanion,
  resolveCompanionWritingChoice,
  type CompanionWritingChoiceId,
} from "@/lib/journal/companionWriting/omakase";
import { writeCompanionWritingCalendarComplete } from "@/lib/journal/companionWriting/session";
import {
  COMPANION_WRITING_APPRAISER_DESCRIPTION,
  COMPANION_WRITING_APPRAISER_HEADING,
  COMPANION_WRITING_FORMAL_TITLE,
  COMPANION_WRITING_OMAKASE_LABEL,
  companionWritingFeedbackOptions,
  type CompanionWritingFeedbackId,
  type CompanionWritingWizardStep,
} from "@/lib/journal/companionWriting/types";
import { DEFAULT_CONTENT_FONT_MODE } from "@/lib/journal/contentFontMode";
import {
  journalCalendarAfterCompanionSavePath,
  journalNewEntryPath,
} from "@/lib/journal/journalNav";
import {
  readJournalCompanionPreference,
  writeJournalCompanionPreference,
} from "@/lib/journal/journalCompanionPreference";
import { LOG_HOUSE_BACK_LINK } from "@/lib/journal/logHouseLabels";
import {
  companionOptions,
  moodOptions,
  type CompanionType,
  type MoodId,
} from "@/lib/journal/meta";
import { OwlLoadingInline } from "@/components/ui/OwlLoadingInline";
import {
  companionWritingWizardStepBodyClass,
  companionWritingWizardStepClass,
  companionWritingWizardStepHeadingClass,
} from "@/components/journal/companion-writing/companionWritingGuideStyles";

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

const stepLabels: Record<CompanionWritingWizardStep, string> = {
  companion: "鑑定士",
  mood: "気分",
  message: "ことば",
  feedback: "近さ",
  answer: "書く",
};

export function CompanionWritingPage() {
  const router = useRouter();
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
    () => readJournalCompanionPreference(),
  );
  const [omakaseResolved, setOmakaseResolved] = useState<CompanionType | null>(null);
  const [mood, setMood] = useState<MoodId>("calm");
  const [feedback, setFeedback] = useState<CompanionWritingFeedbackId | null>(null);
  const [userAnswer, setUserAnswer] = useState("");
  const [entryDate, setEntryDate] = useState(() => toDateInputValue(new Date()));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const companionType = useMemo(
    () => resolveCompanionWritingChoice(companionChoice, omakaseResolved),
    [companionChoice, omakaseResolved],
  );

  useEffect(() => {
    if (!dateFromQuery || !isValidDateInput(dateFromQuery)) {
      setEntryDate(toDateInputValue(new Date()));
      return;
    }
    setEntryDate(dateFromQuery);
  }, [dateFromQuery]);

  const openingMessage = useMemo(
    () => getCompanionOpeningMessage(companionType, mood),
    [companionType, mood],
  );

  const followUpQuestion = useMemo(() => {
    if (!feedback) return "";
    return getCompanionFollowUpQuestion(feedback, mood, companionType);
  }, [companionType, feedback, mood]);

  const appraiserName = getAppraiserDisplayName(companionType);

  const handleCompanionChoice = useCallback((next: CompanionWritingChoiceId) => {
    setCompanionChoice(next);
    if (!isOmakaseChoice(next)) {
      setOmakaseResolved(null);
      writeJournalCompanionPreference(next);
    }
  }, []);

  const advanceFromCompanionStep = useCallback(() => {
    if (isOmakaseChoice(companionChoice)) {
      const picked = omakaseResolved ?? pickOmakaseCompanion();
      setOmakaseResolved(picked);
    }
    setStep("mood");
  }, [companionChoice, omakaseResolved]);

  const saveEntry = useCallback(async () => {
    if (!feedback) return;
    const answer = userAnswer.trim();
    if (!answer) {
      setError("ひとことでも、いまの気持ちを書いてみてください。");
      return;
    }
    if (!canWriteJournal) {
      setError("無料お試し期間が終了したため、新しい記録の作成はできません。");
      return;
    }

    const resolvedCompanion = resolveCompanionWritingChoice(companionChoice, omakaseResolved);

    setError(null);
    setSaving(true);
    try {
      const readingFirstSentence = effectiveProfileId
        ? await fetchCompanionWritingReadingFirstSentence({
            profileId: effectiveProfileId,
            mood,
            companionType: resolvedCompanion,
            entryDateYmd: entryDate,
          })
        : null;

      const content = buildCompanionWritingEntryContent({
        mood,
        feedback,
        readingFirstSentence,
        userAnswer: answer,
      });

      const res = await fetch("/api/journal", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content,
          mood,
          activity: "record_anyway",
          companionType: resolvedCompanion,
          designTheme: "simple_plain",
          contentFontMode: DEFAULT_CONTENT_FONT_MODE,
          entryDate,
          effectiveProfileId,
        }),
      });

      const data = (await res.json()) as { entry?: { id: string }; error?: string };
      if (!res.ok || !data.entry?.id) {
        throw new Error(data.error ?? "保存に失敗しました。");
      }

      writeCompanionWritingCalendarComplete({
        version: 1,
        entryId: data.entry.id,
        entryDateYmd: entryDate,
        companionType: resolvedCompanion,
        profileId: effectiveProfileId,
        designTheme: "simple_plain",
      });

      router.push(
        journalCalendarAfterCompanionSavePath({
          entryDateYmd: entryDate,
          profileId: effectiveProfileId,
        }),
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : "保存に失敗しました。");
    } finally {
      setSaving(false);
    }
  }, [
    canWriteJournal,
    companionChoice,
    effectiveProfileId,
    entryDate,
    feedback,
    mood,
    omakaseResolved,
    router,
    userAnswer,
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
    <div className="mx-auto max-w-lg space-y-5 px-5 py-5 sm:space-y-4 sm:px-4 sm:py-8">
      <header className="space-y-2">
        <p className="text-sm">
          <Link
            href={safeReturnTo ?? LOG_HOUSE_BACK_LINK.href}
            className="text-stone-500 underline-offset-2 hover:text-stone-800 hover:underline"
          >
            {safeReturnTo ? "戻る" : LOG_HOUSE_BACK_LINK.label}
          </Link>
        </p>
        <h1 className="text-xl font-bold leading-snug text-stone-900 sm:text-2xl">
          {COMPANION_WRITING_FORMAL_TITLE}
        </h1>
        <ActiveProfileLabel nickname={profileState.activeProfileNickname} />
        {entitlement ? <TrialStatusBanner entitlement={entitlement} /> : null}
        <p className="text-xs text-stone-500" aria-live="polite">
          {stepLabels[step]} — 短く書くだけで大丈夫です
        </p>
      </header>

      {step === "companion" ? (
        <section className={companionWritingWizardStepClass}>
          <div>
            <h2 className={companionWritingWizardStepHeadingClass}>
              {COMPANION_WRITING_APPRAISER_HEADING}
            </h2>
            <p className={`mt-1.5 ${companionWritingWizardStepBodyClass}`}>
              {COMPANION_WRITING_APPRAISER_DESCRIPTION}
            </p>
          </div>
          <div className="flex flex-wrap gap-2" role="radiogroup" aria-label={COMPANION_WRITING_APPRAISER_HEADING}>
            {companionOptions.map((option) => {
              const selected = companionChoice === option.id;
              return (
                <button
                  key={option.id}
                  type="button"
                  role="radio"
                  aria-checked={selected}
                  onClick={() => handleCompanionChoice(option.id)}
                  className={[
                    "rounded-full border px-3 py-1.5 text-xs font-medium transition",
                    selected
                      ? "border-emerald-500 bg-emerald-50 text-emerald-900 ring-2 ring-emerald-300"
                      : "border-stone-200 bg-white text-stone-700 hover:border-stone-300",
                  ].join(" ")}
                >
                  {option.label}
                </button>
              );
            })}
            <button
              type="button"
              role="radio"
              aria-checked={companionChoice === COMPANION_WRITING_OMAKASE_ID}
              onClick={() => handleCompanionChoice(COMPANION_WRITING_OMAKASE_ID)}
              className={[
                "rounded-full border px-3 py-1.5 text-xs font-medium transition",
                companionChoice === COMPANION_WRITING_OMAKASE_ID
                  ? "border-emerald-500 bg-emerald-50 text-emerald-900 ring-2 ring-emerald-300"
                  : "border-stone-200 bg-white text-stone-700 hover:border-stone-300",
              ].join(" ")}
            >
              {COMPANION_WRITING_OMAKASE_LABEL}
            </button>
          </div>
          <button
            type="button"
            onClick={advanceFromCompanionStep}
            className="min-h-[44px] w-full rounded-lg bg-emerald-800 px-4 py-2.5 text-sm font-medium text-white hover:bg-emerald-900"
          >
            つぎへ
          </button>
        </section>
      ) : null}

      {step === "mood" ? (
        <section className={companionWritingWizardStepClass}>
          {isOmakaseChoice(companionChoice) && omakaseResolved ? (
            <p className="text-sm text-emerald-800">
              今日の案内役：{getAppraiserDisplayName(omakaseResolved)}
            </p>
          ) : null}
          <p className={companionWritingWizardStepBodyClass}>
            {appraiserName}のことばを聞く前に、今日の気分を選んでください。
          </p>
          <fieldset>
            <legend className={`mb-2 block ${companionWritingWizardStepHeadingClass}`}>
              今日の気分
            </legend>
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
              onClick={() => setStep("message")}
              className="min-h-[44px] flex-[2] rounded-lg bg-emerald-800 px-4 py-2.5 text-sm font-medium text-white hover:bg-emerald-900"
            >
              つぎへ
            </button>
          </div>
        </section>
      ) : null}

      {step === "message" ? (
        <section className={companionWritingWizardStepClass}>
          <p className={companionWritingWizardStepBodyClass}>{appraiserName}より</p>
          <blockquote className="rounded-lg border border-emerald-100 bg-emerald-50/60 px-4 py-3.5 text-base leading-7 text-stone-800 sm:py-3 sm:text-sm">
            「{openingMessage}」
          </blockquote>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setStep("mood")}
              className="min-h-[44px] flex-1 rounded-lg border border-stone-300 bg-white px-4 py-2.5 text-sm font-medium text-stone-700 hover:bg-stone-50"
            >
              もどる
            </button>
            <button
              type="button"
              onClick={() => setStep("feedback")}
              className="min-h-[44px] flex-[2] rounded-lg bg-emerald-800 px-4 py-2.5 text-sm font-medium text-white hover:bg-emerald-900"
            >
              つぎへ
            </button>
          </div>
        </section>
      ) : null}

      {step === "feedback" ? (
        <section className={companionWritingWizardStepClass}>
          <p className={`font-medium text-stone-800 ${companionWritingWizardStepHeadingClass}`}>
            今日の数字からのことば、いまのあなたにどれくらい近いですか？
          </p>
          <div className="grid gap-2.5 sm:grid-cols-2 sm:gap-2" role="radiogroup" aria-label="読み解きの受け取り方">
            {companionWritingFeedbackOptions.map((option) => {
              const selected = feedback === option.id;
              return (
                <button
                  key={option.id}
                  type="button"
                  role="radio"
                  aria-checked={selected}
                  onClick={() => {
                    setFeedback(option.id);
                    setStep("answer");
                  }}
                  className={[
                    "min-h-[48px] rounded-lg border px-3 py-3 text-base font-medium transition sm:min-h-[44px] sm:py-2.5 sm:text-sm",
                    selected
                      ? "border-emerald-500 bg-emerald-50 text-emerald-950 ring-2 ring-emerald-300"
                      : "border-stone-200 bg-white text-stone-800 hover:border-stone-300 hover:bg-stone-50",
                  ].join(" ")}
                >
                  {option.label}
                </button>
              );
            })}
          </div>
          <button
            type="button"
            onClick={() => setStep("message")}
            className="min-h-[44px] w-full rounded-lg border border-stone-300 bg-white px-4 py-2.5 text-sm font-medium text-stone-700 hover:bg-stone-50"
          >
            もどる
          </button>
        </section>
      ) : null}

      {step === "answer" && feedback ? (
        <section className={companionWritingWizardStepClass}>
          <p className={`font-medium text-stone-800 ${companionWritingWizardStepHeadingClass}`}>
            {followUpQuestion}
          </p>
          <label className="block space-y-2" htmlFor="companion-writing-answer">
            <span className={companionWritingWizardStepBodyClass}>
              あなたの言葉で、短く残してみてください
            </span>
            <textarea
              id="companion-writing-answer"
              value={userAnswer}
              onChange={(e) => setUserAnswer(e.target.value)}
              rows={6}
              disabled={saving}
              placeholder="例）今日は人に合わせることが多くて、少し疲れた。明日は自分のペースを大事にしたい。"
              className="w-full rounded-lg border border-stone-300 px-3 py-2.5 text-base leading-relaxed text-stone-900 outline-none ring-emerald-500 focus:ring-2"
            />
          </label>
          <div className="flex gap-2">
            <button
              type="button"
              disabled={saving}
              onClick={() => setStep("feedback")}
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

      {error ? (
        <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-800" role="alert">
          {error}
        </p>
      ) : null}

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
    </div>
  );
}
