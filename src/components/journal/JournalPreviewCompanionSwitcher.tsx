"use client";

import {
  companionOptions,
  getCompanionLabel,
  normalizeCompanionType,
  type CompanionType,
} from "@/lib/journal/meta";

type Props = {
  value: string;
  disabled?: boolean;
  switching?: boolean;
  onChange: (next: CompanionType) => void;
};

/** 結果画面での伴走キャラ切り替え（読み解き再生成用・確認向け） */
export function JournalPreviewCompanionSwitcher({
  value,
  disabled = false,
  switching = false,
  onChange,
}: Props) {
  const selected = normalizeCompanionType(value);

  return (
    <section
      className="rounded-xl border border-violet-200 bg-violet-50/80 px-4 py-3"
      aria-busy={switching}
    >
      <p className="text-sm font-medium text-violet-950">伴走キャラ（読み解き確認用）</p>
      <p className="mt-1 text-xs leading-relaxed text-violet-800/90">
        キャラを変えると、この記録の読み解き（本文・アクセント）を選んだキャラの文言で再生成します。
      </p>
      <div className="mt-3 flex flex-wrap gap-2">
        {companionOptions.map((option) => {
          const isSelected = selected === option.id;
          return (
            <button
              key={option.id}
              type="button"
              disabled={disabled || switching}
              aria-pressed={isSelected}
              onClick={() => onChange(option.id)}
              className={[
                "inline-flex max-w-full items-center rounded-full border px-3 py-1.5 text-xs font-medium transition",
                isSelected
                  ? "border-violet-500 bg-white text-violet-950 ring-2 ring-violet-300"
                  : "border-violet-200 bg-white/70 text-violet-900 hover:border-violet-300 hover:bg-white",
                disabled || switching ? "opacity-60" : "",
              ].join(" ")}
            >
              {option.label}
            </button>
          );
        })}
      </div>
      {switching ? (
        <p className="mt-2 text-xs text-violet-800">読み解きを切り替えています…</p>
      ) : (
        <p className="mt-2 text-xs text-violet-700/90">
          現在: {getCompanionLabel(selected)}
        </p>
      )}
    </section>
  );
}
