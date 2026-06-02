"use client";

import { FieldLabelWithHelp } from "@/components/ui/InlineHelpButton";
import { JOURNAL_COMPANION_HELP } from "@/lib/journal/journalInputHelpCopy";

/** 入力画面用（第1フェーズ表示）。meta とは別定義で HMR 時の import 不整合を避ける */
const COMPANION_CHIPS = [
  { id: "owl", label: "フクロウ先生", available: true },
  { id: "hedgehog", label: "ハリネズミくん", available: false },
  { id: "sloth", label: "ナマケモノくん", available: false },
  { id: "squirrel", label: "リスくん", available: false },
  { id: "frog", label: "ケロシオン", available: false },
] as const;

type Props = {
  disabled?: boolean;
};

export function JournalCompanionPicker({ disabled = false }: Props) {
  return (
    <fieldset className="space-y-2" disabled={disabled}>
      <legend className="sr-only">伴走キャラを選ぶ</legend>
      <FieldLabelWithHelp label="伴走キャラを選ぶ" help={JOURNAL_COMPANION_HELP} />
      <div className="flex flex-wrap gap-2">
        {COMPANION_CHIPS.map((option) => {
          if (option.available) {
            return (
              <span
                key={option.id}
                aria-current="true"
                className="inline-flex max-w-full flex-wrap items-center gap-1.5 rounded-full border border-emerald-500 bg-emerald-50 px-3 py-1.5 text-xs font-medium text-emerald-900"
              >
                <span>{option.label}</span>
                <span className="font-normal text-emerald-700">現在選択中</span>
              </span>
            );
          }
          return (
            <span
              key={option.id}
              aria-disabled="true"
              className="inline-flex max-w-full flex-wrap items-center gap-1.5 rounded-full border border-stone-200 bg-stone-100/90 px-3 py-1.5 text-xs text-stone-400"
            >
              <span>{option.label}</span>
              <span className="rounded-full bg-stone-200/90 px-1.5 py-0.5 text-[10px] font-medium leading-tight text-stone-500">
                準備中
              </span>
            </span>
          );
        })}
      </div>
    </fieldset>
  );
}
