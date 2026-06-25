"use client";

import { useState } from "react";

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

/** 結果画面での伴走キャラ切り替え（読み解き再生成用・初期は折りたたみ） */
export function JournalPreviewCompanionSwitcher({
  value,
  disabled = false,
  switching = false,
  onChange,
}: Props) {
  const [expanded, setExpanded] = useState(false);
  const selected = normalizeCompanionType(value);

  if (!expanded) {
    return (
      <section className="rounded-lg border border-violet-100 bg-violet-50/40 px-3 py-2.5">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
          <button
            type="button"
            disabled={disabled || switching}
            onClick={() => setExpanded(true)}
            className="text-sm font-medium text-violet-900 underline-offset-2 hover:underline disabled:opacity-60"
          >
            伴走キャラ変更
          </button>
          <span className="text-xs text-violet-800/80">現在: {getCompanionLabel(selected)}</span>
        </div>
      </section>
    );
  }

  return (
    <section
      className="rounded-xl border border-violet-200 bg-violet-50/80 px-4 py-3"
      aria-busy={switching}
    >
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm font-medium text-violet-950">伴走キャラ変更</p>
        <button
          type="button"
          disabled={switching}
          onClick={() => setExpanded(false)}
          className="shrink-0 text-xs text-violet-800 underline-offset-2 hover:underline disabled:opacity-60"
        >
          閉じる
        </button>
      </div>
      <p className="mt-1 text-xs leading-relaxed text-violet-800/90">
        伴走キャラを変更すると、この記録の読み解きコメントが、選んだどうぶつ鑑定士の言葉に変わります。
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
        <p className="mt-2 text-xs text-violet-700/90">現在: {getCompanionLabel(selected)}</p>
      )}
    </section>
  );
}
