"use client";

import { JournalCompanionPicker } from "@/components/journal/JournalCompanionPicker";
import { JournalContentLengthAlerts } from "@/components/journal/JournalContentLengthAlerts";
import { JournalWritingComposer } from "@/components/journal/JournalWritingComposer";
import { MoodOwlIcon } from "@/components/journal/MoodOwlIcon";
import { FieldLabelWithHelp } from "@/components/ui/InlineHelpButton";
import {
  DEFAULT_CONTENT_FONT_MODE,
  JOURNAL_CONTENT_SOFT_MAX_BY_MODE,
} from "@/lib/journal/contentFontMode";
import {
  countBodyLayoutLines,
  getDiaryBodyLineLimit,
  isDiaryBodyOverLineLimit,
} from "@/lib/journal/diaryPreviewBodyLineLimits";
import { JOURNAL_CONTENT_HELP } from "@/lib/journal/journalInputHelpCopy";
import {
  formatJournalRecordPageTitle,
  journalBodyInputHeading,
} from "@/lib/journal/journalRecordDateDisplay";
import { moodOptions, type MoodId } from "@/lib/journal/meta";

const DEMO_ENTRY_DATE = "2026-08-13";
const DEMO_CONTENT =
  "モゲが帰ってきて4ヶ月。今日はお部屋の掃除をしました。モゲはいつも通り、ケージの中で丸くなって寝ていました。そんな日常のひとコマです。";
const DEMO_ACTIVITY_ANSWER = "おでかけした。動物とふれあう体験ができた。";

const DEMO_PHOTO_SRC = "/images/home-mock/demo-journal-photo.png";

export function HomeMockJournalCapture() {
  const recordPageTitle = formatJournalRecordPageTitle(DEMO_ENTRY_DATE);
  const bodyInputHeading = journalBodyInputHeading(DEMO_ENTRY_DATE);
  const contentFontMode = DEFAULT_CONTENT_FONT_MODE;
  const charCount = DEMO_CONTENT.length;
  const charMax = JOURNAL_CONTENT_SOFT_MAX_BY_MODE[contentFontMode];
  const { maxLines: bodyMaxLines } = getDiaryBodyLineLimit(contentFontMode);
  const bodyLineCount = countBodyLayoutLines(DEMO_CONTENT, contentFontMode);
  const bodyOverflows = isDiaryBodyOverLineLimit(DEMO_CONTENT, contentFontMode);
  const selectedMood: MoodId = "calm";

  return (
    <div className="relative space-y-3">
      <div className="space-y-1">
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="text-[1.375rem] font-bold leading-tight text-stone-900 sm:text-[1.75rem]">
            {recordPageTitle}
          </h1>
          <span className="hidden rounded-full border border-violet-200/90 bg-violet-50 px-2.5 py-0.5 text-xs font-medium text-violet-900 sm:inline">
            メイン
          </span>
        </div>
        <p className="flex flex-wrap items-center gap-x-3 text-sm text-stone-500">
          <span className="underline-offset-2">ログハウス</span>
          <span className="text-emerald-800 underline-offset-2">カレンダーへ戻る</span>
        </p>
      </div>

      <form className="space-y-3 rounded-xl border border-stone-200 bg-white p-4 shadow-sm sm:p-5">
        <JournalWritingComposer
          label={
            <FieldLabelWithHelp
              as="label"
              htmlFor="home-mock-journal-content"
              label={bodyInputHeading}
              help={JOURNAL_CONTENT_HELP}
              helpAriaLabel={`${bodyInputHeading}の説明`}
              labelClassName="lj-read-desc font-semibold text-stone-800"
            />
          }
          recordPageTitle={recordPageTitle}
          bodyInputHeading={bodyInputHeading}
          content={DEMO_CONTENT}
          onContentChange={() => undefined}
          onContentFontModeChange={() => undefined}
          disabled
          placeholder=""
          contentFontMode={contentFontMode}
          charCount={charCount}
          charMax={charMax}
          bodyLineCount={bodyLineCount}
          bodyMaxLines={bodyMaxLines}
          bodyOverflows={bodyOverflows}
          commentOverflows={false}
        />

        <JournalContentLengthAlerts
          contentFontMode={contentFontMode}
          contentLength={charCount}
          bodyOverflows={bodyOverflows}
          commentOverflows={false}
        />

        <div className="space-y-2 rounded-lg border border-dashed border-stone-200/90 bg-[#faf8f5]/50 px-3 py-3">
          <label className="lj-read-desc block font-medium text-stone-700" htmlFor="home-mock-journal-photo">
            この日の写真（任意）
          </label>
          <p className="w-full rounded-lg border border-stone-300 bg-white px-3 py-2.5 text-base text-stone-500">
            hedgehog-photo.jpeg
          </p>
          <label className="block">
            <span className="lj-read-caption text-stone-600">写真の位置調整（50%）</span>
            <input type="range" min={0} max={100} step={1} value={50} readOnly className="mt-1 w-full" />
          </label>
          <img
            src={DEMO_PHOTO_SRC}
            alt="選択した写真プレビュー"
            className="aspect-square w-full max-w-xs rounded-lg border border-stone-200 bg-[#f7f4ee] object-contain"
          />
        </div>

        <div className="space-y-3 border-t border-stone-100 pt-3">
          <JournalCompanionPicker value="owl" onChange={() => undefined} disabled />

          <label className="block text-base font-medium text-stone-700" htmlFor="home-mock-entry-date">
            記録日
          </label>
          <input
            id="home-mock-entry-date"
            type="date"
            value={DEMO_ENTRY_DATE}
            readOnly
            className="w-full rounded-lg border border-stone-300 px-3 py-2 text-base text-stone-900 outline-none"
          />

          <fieldset>
            <legend className="mb-2 block text-base font-medium text-stone-700">今日の気分</legend>
            <div
              className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-5"
              role="radiogroup"
              aria-label="今日の気分"
            >
              {moodOptions.map((option) => {
                const selected = selectedMood === option.id;
                return (
                  <div
                    key={option.id}
                    role="radio"
                    aria-checked={selected}
                    className={[
                      "flex flex-col items-center gap-1.5 rounded-lg border px-2 py-2.5 text-center",
                      selected
                        ? "border-stone-500 bg-stone-50 ring-2 ring-stone-400"
                        : "border-stone-200 bg-white",
                    ].join(" ")}
                  >
                    <MoodOwlIcon moodId={option.id} sizePx={44} />
                    <span className="text-xs font-medium text-stone-800">{option.label}</span>
                  </div>
                );
              })}
            </div>
          </fieldset>

          <div>
            <p className="text-base font-medium text-stone-700">今日はどんな一日でしたか？</p>
            <p className="mt-2 rounded-lg border border-stone-200 bg-stone-50/80 px-3 py-2.5 text-base text-stone-800">
              {DEMO_ACTIVITY_ANSWER}
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-2 pt-1 sm:flex-row sm:flex-wrap">
          <button
            type="button"
            className="min-h-[44px] rounded-lg bg-stone-900 px-4 py-2.5 text-base font-medium text-white"
          >
            保存する
          </button>
        </div>
      </form>
    </div>
  );
}
