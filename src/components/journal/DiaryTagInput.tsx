"use client";

import { useCallback, useRef } from "react";

const TAG_INPUT_PLACEHOLDER = "例）#モグ #おでかけ #家族";

function appendHashToTagInput(current: string): string {
  const trimmedEnd = current.replace(/\s+$/, "");
  if (!trimmedEnd) return "#";
  return `${trimmedEnd} #`;
}

type FieldProps = {
  id: string;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  placeholder?: string;
  inputType?: "text" | "search";
  className?: string;
};

/** タグ入力＋# ボタン（ラベルなし） */
export function DiaryTagInputField({
  id,
  value,
  onChange,
  disabled = false,
  placeholder = TAG_INPUT_PLACEHOLDER,
  inputType = "text",
  className = "",
}: FieldProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  const insertHash = useCallback(() => {
    if (disabled) return;
    const next = appendHashToTagInput(value);
    onChange(next);
    window.requestAnimationFrame(() => {
      const input = inputRef.current;
      if (!input) return;
      input.focus();
      input.setSelectionRange(next.length, next.length);
    });
  }, [disabled, onChange, value]);

  return (
    <div className={`flex gap-2 ${className}`.trim()}>
      <input
        ref={inputRef}
        id={id}
        type={inputType}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        disabled={disabled}
        placeholder={placeholder}
        autoComplete="off"
        className="min-w-0 flex-1 rounded-lg border border-stone-300 px-3 py-2.5 text-base leading-relaxed text-stone-900 placeholder:text-stone-400 outline-none ring-stone-400 focus:ring-2 disabled:opacity-60"
      />
      <button
        type="button"
        onClick={insertHash}
        disabled={disabled}
        aria-label="タグ記号 # を入力"
        className="shrink-0 min-h-[44px] min-w-[44px] rounded-lg border border-stone-300 bg-stone-50 px-3 text-base font-medium text-stone-700 hover:bg-stone-100 disabled:opacity-60"
      >
        #
      </button>
    </div>
  );
}

type Props = {
  id?: string;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  className?: string;
};

/** 日記タグ入力（任意・本文とは分離して保存時に結合） */
export function DiaryTagInput({
  id = "diary-tags",
  value,
  onChange,
  disabled = false,
  className = "",
}: Props) {
  return (
    <div className={className}>
      <label htmlFor={id} className="block text-sm font-medium text-stone-800">
        タグをつける
      </label>
      <DiaryTagInputField
        id={id}
        value={value}
        onChange={onChange}
        disabled={disabled}
        className="mt-2"
      />
    </div>
  );
}

export { TAG_INPUT_PLACEHOLDER };
