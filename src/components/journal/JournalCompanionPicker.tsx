"use client";

import { FieldLabelWithHelp } from "@/components/ui/InlineHelpButton";
import { JOURNAL_COMPANION_HELP } from "@/lib/journal/journalInputHelpCopy";
import {
  companionOptions,
  normalizeCompanionType,
  type CompanionType,
} from "@/lib/journal/meta";

type Props = {
  value: string;
  onChange: (next: CompanionType) => void;
  disabled?: boolean;
};

export function JournalCompanionPicker({ value, onChange, disabled = false }: Props) {
  const selected = normalizeCompanionType(value);

  return (
    <fieldset className="space-y-2" disabled={disabled}>
      <legend className="sr-only">伴走キャラを選ぶ</legend>
      <FieldLabelWithHelp label="伴走キャラを選ぶ" help={JOURNAL_COMPANION_HELP} />
      <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="伴走キャラを選ぶ">
        {companionOptions.map((option) => {
          const isSelected = selected === option.id;
          return (
            <button
              key={option.id}
              type="button"
              role="radio"
              aria-checked={isSelected}
              onClick={() => onChange(option.id)}
              className={[
                "inline-flex max-w-full flex-wrap items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition",
                isSelected
                  ? "border-emerald-500 bg-emerald-50 text-emerald-900 ring-2 ring-emerald-300"
                  : "border-stone-200 bg-white text-stone-700 hover:border-stone-300 hover:bg-stone-50",
              ].join(" ")}
            >
              <span>{option.label}</span>
              {isSelected ? (
                <span className="font-normal text-emerald-700">選択中</span>
              ) : null}
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}
