"use client";

import { DiaryTagInputField, TAG_INPUT_PLACEHOLDER } from "@/components/journal/DiaryTagInput";
import type { DiaryBookTagFilterMode } from "@/lib/journal/diaryTags";

type Props = {
  tagFilter: string;
  tagFilterMode: DiaryBookTagFilterMode;
  onTagFilterChange: (value: string) => void;
  onTagFilterModeChange: (mode: DiaryBookTagFilterMode) => void;
  disabled?: boolean;
  idPrefix?: string;
};

const modeButtonClass = (selected: boolean) =>
  [
    "min-h-[44px] flex-1 rounded-lg border px-3 py-2 text-sm font-medium transition",
    selected
      ? "border-emerald-600 bg-emerald-50 text-emerald-950 ring-1 ring-emerald-200"
      : "border-stone-300 bg-white text-stone-800 hover:bg-stone-50",
  ].join(" ");

/** あしあとブックのタグ条件入力（複数タグ + AND/OR） */
export function DiaryBookTagFilterFields({
  tagFilter,
  tagFilterMode,
  onTagFilterChange,
  onTagFilterModeChange,
  disabled = false,
  idPrefix = "diary-book-tag",
}: Props) {
  const hasTags = tagFilter.trim().length > 0;

  return (
    <div className="space-y-3">
      <div className="block text-sm">
        <span className="mb-1 block text-stone-700">タグで絞り込む（任意）</span>
        <DiaryTagInputField
          id={`${idPrefix}-filter`}
          value={tagFilter}
          onChange={onTagFilterChange}
          disabled={disabled}
          placeholder={TAG_INPUT_PLACEHOLDER}
        />
      </div>

      {hasTags ? (
        <fieldset className="space-y-2" disabled={disabled}>
          <legend className="text-sm text-stone-700">検索方法</legend>
          <div className="flex gap-2">
            <button
              type="button"
              aria-pressed={tagFilterMode === "AND"}
              onClick={() => onTagFilterModeChange("AND")}
              className={modeButtonClass(tagFilterMode === "AND")}
            >
              すべて含む
            </button>
            <button
              type="button"
              aria-pressed={tagFilterMode === "OR"}
              onClick={() => onTagFilterModeChange("OR")}
              className={modeButtonClass(tagFilterMode === "OR")}
            >
              どれか含む
            </button>
          </div>
          <p className="text-xs leading-relaxed text-stone-500">
            すべて含む：入力したタグがすべて付いているあしあとを表示します。
            <br />
            どれか含む：入力したタグのどれかが付いているあしあとを表示します。
          </p>
        </fieldset>
      ) : null}
    </div>
  );
}
