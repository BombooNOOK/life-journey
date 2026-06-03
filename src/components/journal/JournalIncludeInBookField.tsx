"use client";

type Props = {
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
};

/** 日記入力・編集：日記ブック／製本への掲載 ON/OFF */
export function JournalIncludeInBookField({ checked, onChange, disabled = false }: Props) {
  return (
    <div className="rounded-lg border border-stone-200/90 bg-[#faf8f5]/80 px-3 py-3">
      <label className="flex cursor-pointer items-start gap-2.5">
        <input
          type="checkbox"
          checked={checked}
          disabled={disabled}
          onChange={(e) => onChange(e.target.checked)}
          className="mt-0.5 h-4 w-4 shrink-0 rounded border-stone-300 text-emerald-700 focus:ring-emerald-600 disabled:opacity-60"
        />
        <span className="min-w-0 space-y-1">
          <span className="block text-sm font-medium text-stone-800">この日記を本に入れる</span>
          <span className="block text-xs leading-relaxed text-stone-500">
            OFFにしても日記は保存されます。日記ブックや製本用の内容には含まれません。
          </span>
        </span>
      </label>
    </div>
  );
}
