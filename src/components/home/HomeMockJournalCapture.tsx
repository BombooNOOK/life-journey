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
import { formatDateTimeJa } from "@/lib/date/formatJa";
import { getMoodMeta, moodOptions, type MoodId } from "@/lib/journal/meta";

const DEMO_ENTRY_DATE = "2026-08-13";
const DEMO_CONTENT =
  "モゲが帰ってきて4ヶ月。今日はお部屋の掃除をしました。モゲはいつも通り、ケージの中で丸くなって寝ていました。そんな日常のひとコマです。";
const DEMO_ACTIVITY_ANSWER = "おでかけした。動物とふれあう体験ができた。";
const DEMO_PREVIOUS_ENTRY = {
  mood: "happy" as MoodId,
  summary:
    "やったこと：京都へ行った。登場：フクロウ先生。写真：あり。本文：動物ふれあいセンターでハリネズミに会えた。小さな体でちょこんとしている姿がかわいくて、触れるときはちょっとドキドキしたけれど、ふわふわの感触が忘れられない。帰り道、少しだけ気持ちが軽くなった気がした。",
  createdAt: "2026-08-13T12:00:00.000Z",
};

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
        <h1 className="text-xl font-bold leading-tight text-stone-900 sm:text-2xl">
          {recordPageTitle}
        </h1>
        <p className="text-xs leading-relaxed text-stone-500">
          トゲトゲと、おでかけと、ひとりごと
        </p>
      </div>

      <div className="space-y-3 rounded-xl border border-stone-200 bg-white p-4 shadow-sm sm:p-5">
        <JournalWritingComposer
          label={
            <FieldLabelWithHelp
              as="label"
              htmlFor="home-mock-journal-content"
              label={bodyInputHeading}
              help={JOURNAL_CONTENT_HELP}
              helpAriaLabel={`${bodyInputHeading}の説明`}
              labelClassName="text-base font-semibold text-stone-800"
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
          <p className="text-sm font-medium text-stone-700">この日の写真（任意）</p>
          <p className="rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm text-stone-500">
            hedgehog-photo.jpeg
          </p>
          <p className="text-xs text-stone-600">写真の位置調整（50%）</p>
          <div className="h-1.5 w-full rounded-full bg-stone-200">
            <div className="h-1.5 w-1/2 rounded-full bg-stone-400" />
          </div>
          <img
            src={DEMO_PHOTO_SRC}
            alt="選択した写真プレビュー"
            className="aspect-square w-full max-w-xs rounded-lg border border-stone-200 bg-[#f7f4ee] object-cover"
          />
        </div>

        <div className="space-y-3 border-t border-stone-100 pt-3">
          <JournalCompanionPicker disabled />

          <label className="block text-sm font-medium text-stone-700" htmlFor="home-mock-entry-date">
            記録日
          </label>
          <input
            id="home-mock-entry-date"
            type="date"
            value={DEMO_ENTRY_DATE}
            readOnly
            className="w-full rounded-lg border border-stone-300 px-3 py-2 text-sm text-stone-900 outline-none"
          />

          <fieldset>
            <legend className="mb-2 block text-sm font-medium text-stone-700">今日の気分</legend>
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
            <p className="text-sm font-medium text-stone-700">今日はどんな一日でしたか？</p>
            <p className="mt-2 rounded-lg border border-stone-200 bg-stone-50/80 px-3 py-2.5 text-sm text-stone-800">
              {DEMO_ACTIVITY_ANSWER}
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-2 pt-1 sm:flex-row sm:flex-wrap">
          <button
            type="button"
            className="rounded-lg bg-stone-900 px-4 py-2.5 text-sm font-medium text-white"
          >
            保存する
          </button>
          <button
            type="button"
            className="rounded-lg border border-violet-300 bg-violet-50 px-4 py-2.5 text-sm font-medium text-violet-950"
          >
            保存してプレビュー
          </button>
          <button
            type="button"
            className="rounded-lg border border-stone-300 bg-white px-4 py-2.5 text-sm font-medium text-stone-800"
          >
            保存してマイページへ
          </button>
          <button
            type="button"
            className="rounded-lg border border-stone-200 bg-white px-4 py-2.5 text-sm text-stone-600"
          >
            入力をクリア
          </button>
        </div>
      </div>

      <section className="space-y-3">
        <h2 className="text-base font-semibold text-stone-900">これまでの記録</h2>
        <article className="rounded-xl border border-stone-200 bg-white p-4 shadow-sm">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div className="flex items-center gap-2 text-sm text-stone-700">
              <MoodOwlIcon moodId={DEMO_PREVIOUS_ENTRY.mood} sizePx={22} className="shrink-0" />
              <span>{getMoodMeta(DEMO_PREVIOUS_ENTRY.mood).label}</span>
            </div>
            <div className="flex gap-2 text-xs text-stone-500">
              <span>編集</span>
              <span>複製</span>
              <span>削除</span>
            </div>
          </div>
          <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-stone-800">
            {DEMO_PREVIOUS_ENTRY.summary}
          </p>
          <p className="mt-3 text-xs text-stone-500">
            {formatDateTimeJa(new Date(DEMO_PREVIOUS_ENTRY.createdAt))}
          </p>
        </article>
      </section>
    </div>
  );
}
