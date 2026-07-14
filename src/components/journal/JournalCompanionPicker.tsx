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
                  ? "border-[#a8b08f]/95 bg-[#eef1e4] text-[#4a5440] ring-2 ring-[#c5d0a8]/80"
                  : "border-[#e0d2bc]/90 bg-[#fffaf2]/90 text-[#6a5846] hover:border-[#c5b089] hover:bg-[#f7efe3]",
              ].join(" ")}
            >
              <span>{option.label}</span>
              {isSelected ? (
                <span className="font-normal text-[#6e7c57]">選択中</span>
              ) : null}
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}
