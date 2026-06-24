"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import { generateDiaryReading } from "@/lib/diary-reading/generateDiaryReading";
import type { DiaryActionCategory, NumerologyNumber } from "@/lib/diary-reading/types";
import { getCompanionBaseCommentText } from "@/lib/journal/commentPersonalDayActivityByCompanion";
import {
  companionOptions,
  getCompanionLabel,
  normalizeCompanionType,
  type CompanionType,
} from "@/lib/journal/meta";

const ACTION_SAMPLES: { id: DiaryActionCategory; label: string }[] = [
  { id: "work_study", label: "仕事・勉強をがんばった" },
  { id: "family_friends", label: "家族・友人と過ごした" },
  { id: "new_challenge", label: "新しいことをした" },
  { id: "rest", label: "ゆっくり休んだ" },
  { id: "anxious", label: "不安が強かった" },
  { id: "irritated", label: "イライラした" },
  { id: "lost_confidence", label: "自信をなくした" },
  { id: "nothing_to_do", label: "何もしたくない日だった" },
  { id: "did_not_go_well", label: "うまくいかず落ち込んだ" },
  { id: "ordinary_record", label: "特別なことはないけれど、記録したい" },
];

const PERSONAL_DAYS = [1, 2, 3, 4, 5, 6, 7, 8, 9] as const satisfies readonly NumerologyNumber[];

export function JournalCompanionCommentsPreviewClient() {
  const [companion, setCompanion] = useState<CompanionType>("hedgehog");
  const [actionCategory, setActionCategory] = useState<DiaryActionCategory>("anxious");
  const [personalDay, setPersonalDay] = useState<NumerologyNumber>(1);

  const reading = useMemo(
    () =>
      generateDiaryReading({
        actionCategory,
        mood: "calm",
        personalYear: 1,
        personalMonth: 6,
        personalDay,
        calendarMonth: 6,
        calendarDay: 21,
        companionType: companion,
      }),
    [actionCategory, companion, personalDay],
  );

  const owlBase = useMemo(() => {
    const templateId = reading.usedTemplateIds[0];
    if (!templateId) return null;
    return getCompanionBaseCommentText(templateId, "owl");
  }, [reading.usedTemplateIds]);

  const companionBase = useMemo(() => {
    const templateId = reading.usedTemplateIds[0];
    if (!templateId) return null;
    return getCompanionBaseCommentText(templateId, companion);
  }, [companion, reading.usedTemplateIds]);

  const templateId = reading.usedTemplateIds[0] ?? "（なし）";

  return (
    <div className="space-y-8">
      <section className="rounded-lg border border-stone-200 bg-white px-4 py-3 text-sm text-stone-700">
        <p className="font-medium text-stone-900">このページで確認できること</p>
        <ul className="mt-2 list-disc space-y-1 pl-5 text-xs leading-relaxed text-stone-600">
          <li>伴走キャラを変えると、読み解きの<strong>本文</strong>と<strong>アクセント文</strong>が切り替わります</li>
          <li>
            <Link href="/preview/diary-book-entry" className="text-emerald-800 underline">
              日記ブック本文テンプレ
            </Link>
            の読み解きはレイアウト用サンプル固定です（ここでは切り替わりません）
          </li>
        </ul>
      </section>

      <section>
        <h2 className="text-sm font-semibold text-stone-800">伴走キャラ</h2>
        <div className="mt-3 flex flex-wrap gap-2">
          {companionOptions.map((option) => {
            const isSelected = companion === option.id;
            return (
              <button
                key={option.id}
                type="button"
                aria-pressed={isSelected}
                onClick={() => setCompanion(option.id)}
                className={[
                  "rounded-full border px-3 py-1.5 text-xs font-medium transition",
                  isSelected
                    ? "border-violet-500 bg-violet-50 text-violet-950 ring-2 ring-violet-300"
                    : "border-stone-200 bg-white text-stone-700 hover:border-stone-300",
                ].join(" ")}
              >
                {option.label}
              </button>
            );
          })}
        </div>
      </section>

      <section>
        <h2 className="text-sm font-semibold text-stone-800">今日のできごと（カテゴリ）</h2>
        <div className="mt-3 flex flex-wrap gap-2">
          {ACTION_SAMPLES.map((item) => {
            const isSelected = actionCategory === item.id;
            return (
              <button
                key={item.id}
                type="button"
                aria-pressed={isSelected}
                onClick={() => setActionCategory(item.id)}
                className={[
                  "rounded-lg border px-2.5 py-1.5 text-xs transition",
                  isSelected
                    ? "border-emerald-600 bg-emerald-50 text-emerald-950"
                    : "border-stone-200 bg-white text-stone-700 hover:bg-stone-50",
                ].join(" ")}
              >
                {item.label}
              </button>
            );
          })}
        </div>
      </section>

      <section>
        <h2 className="text-sm font-semibold text-stone-800">パーソナルデイ（1〜9）</h2>
        <div className="mt-3 flex flex-wrap gap-2">
          {PERSONAL_DAYS.map((day) => {
            const isSelected = personalDay === day;
            return (
              <button
                key={day}
                type="button"
                aria-pressed={isSelected}
                onClick={() => setPersonalDay(day)}
                className={[
                  "min-w-[2.5rem] rounded-lg border px-2 py-1.5 text-xs font-medium transition",
                  isSelected
                    ? "border-emerald-600 bg-emerald-50 text-emerald-950"
                    : "border-stone-200 bg-white text-stone-700 hover:bg-stone-50",
                ].join(" ")}
              >
                {day}
              </button>
            );
          })}
        </div>
        <p className="mt-2 text-xs text-stone-500">
          テンプレ ID 例: <code className="rounded bg-stone-200 px-1">{templateId}</code>
        </p>
      </section>

      <section className="rounded-xl border border-[#e8dfd0] bg-[#f7f1e6] px-4 py-4 shadow-sm sm:px-5 sm:py-5">
        <h3 className="text-sm font-semibold text-stone-800">
          {getCompanionLabel(normalizeCompanionType(companion))}より
        </h3>
        <p className="mt-3 whitespace-pre-wrap break-words text-sm leading-relaxed text-stone-800">
          {reading.text}
        </p>
      </section>

      {owlBase && companionBase && companion !== "owl" ? (
        <section className="rounded-xl border border-stone-200 bg-white px-4 py-4 text-sm">
          <h3 className="font-semibold text-stone-800">ベース文だけ比較（アクセント除く）</h3>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <div className="rounded-lg bg-stone-50 px-3 py-3">
              <p className="text-xs font-medium text-stone-500">フクロウ先生</p>
              <p className="mt-2 text-xs leading-relaxed text-stone-800">{owlBase}</p>
            </div>
            <div className="rounded-lg bg-violet-50 px-3 py-3">
              <p className="text-xs font-medium text-violet-800">{getCompanionLabel(companion)}</p>
              <p className="mt-2 text-xs leading-relaxed text-stone-800">{companionBase}</p>
            </div>
          </div>
        </section>
      ) : null}
    </div>
  );
}
