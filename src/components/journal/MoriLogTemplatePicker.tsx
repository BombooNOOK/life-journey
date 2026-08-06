"use client";

import Image from "next/image";
import { useState } from "react";

import {
  MORI_ASHIATO_TEMPLATE_IDS,
  isMoriAshiatoTemplateId,
  moriLogPickerPreviewPath,
} from "@/lib/journal/social-post-image/moriAshiatoTemplates";
import {
  JOURNAL_SOCIAL_POST_TEMPLATES,
  resolveJournalSocialPostDesignSize,
  type JournalSocialPostTemplateId,
} from "@/lib/journal/social-post-image/templates";

const LEGACY_SNS_TEMPLATE_IDS = ["sns02", "sns03"] as const satisfies readonly JournalSocialPostTemplateId[];

type Props = {
  value: JournalSocialPostTemplateId;
  onChange: (id: JournalSocialPostTemplateId) => void;
  /** ひだまりフォト / 森のスクラップも一覧に出すか */
  includeLegacySns?: boolean;
};

function aspectFor(id: JournalSocialPostTemplateId): string {
  const size = resolveJournalSocialPostDesignSize(JOURNAL_SOCIAL_POST_TEMPLATES[id]);
  return `${size.widthPx} / ${size.heightPx}`;
}

function pickerPreviewSrc(id: JournalSocialPostTemplateId): string {
  if (isMoriAshiatoTemplateId(id)) return moriLogPickerPreviewPath(id);
  if (id === "sns02") return "/images/journal-social-post/sns02-template-sample.png";
  if (id === "sns03") return "/images/journal-social-post/sns03-template-sample.png";
  return "/images/journal-social-post/sns02-template-sample.png";
}

export function MoriLogTemplatePicker({
  value,
  onChange,
  includeLegacySns = false,
}: Props) {
  const [enlargeId, setEnlargeId] = useState<JournalSocialPostTemplateId | null>(null);
  const templateIds: JournalSocialPostTemplateId[] = includeLegacySns
    ? [...MORI_ASHIATO_TEMPLATE_IDS, ...LEGACY_SNS_TEMPLATE_IDS]
    : [...MORI_ASHIATO_TEMPLATE_IDS];

  return (
    <fieldset className="space-y-3">
      <legend className="text-sm font-medium text-stone-800">デザイン</legend>
      <p className="text-xs leading-relaxed text-stone-500">
        写真入りの見本です。選ぶと下の入力欄とプレビューが切り替わります。
      </p>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {templateIds.map((id) => {
          const selected = value === id;
          const label = JOURNAL_SOCIAL_POST_TEMPLATES[id].label;
          return (
            <div
              key={id}
              className={[
                "rounded-xl border-2 p-2.5 transition",
                selected
                  ? "border-emerald-600 bg-emerald-50/80 ring-2 ring-emerald-200"
                  : "border-stone-200 bg-white",
              ].join(" ")}
            >
              <button
                type="button"
                onClick={() => onChange(id)}
                className="block w-full text-left"
                aria-pressed={selected}
              >
                <span
                  className="relative mx-auto block w-full overflow-hidden rounded-md border border-stone-200 bg-stone-100"
                  style={{ aspectRatio: aspectFor(id) }}
                >
                  <Image
                    src={pickerPreviewSrc(id)}
                    alt={`${label}の見本`}
                    fill
                    className="object-contain"
                    sizes="(max-width: 640px) 45vw, 180px"
                    unoptimized
                  />
                </span>
                <span className="mt-2 block text-center text-xs font-semibold leading-snug text-stone-900">
                  {label}
                </span>
              </button>
              <div className="mt-2 flex flex-wrap justify-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setEnlargeId(id)}
                  className="rounded-md border border-stone-300 bg-white px-2 py-1 text-[11px] font-medium text-stone-700 hover:bg-stone-50"
                >
                  大きく見る
                </button>
                <button
                  type="button"
                  aria-pressed={selected}
                  onClick={() => onChange(id)}
                  className={[
                    "rounded-md px-2 py-1 text-[11px] font-medium",
                    selected
                      ? "bg-emerald-800 text-white"
                      : "border border-emerald-300 bg-emerald-50 text-emerald-950 hover:bg-emerald-100",
                  ].join(" ")}
                >
                  {selected ? "選択中" : "これにする"}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {enlargeId ? (
        <MoriLogTemplateEnlargeModal
          templateId={enlargeId}
          onClose={() => setEnlargeId(null)}
          onSelect={() => {
            onChange(enlargeId);
            setEnlargeId(null);
          }}
          selected={value === enlargeId}
        />
      ) : null}
    </fieldset>
  );
}

function MoriLogTemplateEnlargeModal({
  templateId,
  onClose,
  onSelect,
  selected,
}: {
  templateId: JournalSocialPostTemplateId;
  onClose: () => void;
  onSelect: () => void;
  selected: boolean;
}) {
  const label = JOURNAL_SOCIAL_POST_TEMPLATES[templateId].label;
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/50 p-4"
      role="dialog"
      aria-modal="true"
      aria-label={`${label}を大きく見る`}
      onClick={onClose}
    >
      <div
        className="max-h-[90vh] w-full max-w-md overflow-auto rounded-2xl bg-white p-4 shadow-xl"
        onClick={(event) => event.stopPropagation()}
      >
        <p className="text-sm font-semibold text-stone-900">{label}</p>
        <div
          className="relative mx-auto mt-3 w-full overflow-hidden rounded-lg border border-stone-200 bg-stone-100"
          style={{ aspectRatio: aspectFor(templateId) }}
        >
          <Image
            src={pickerPreviewSrc(templateId)}
            alt={`${label}の見本（拡大）`}
            fill
            className="object-contain"
            sizes="400px"
            unoptimized
          />
        </div>
        <div className="mt-4 flex flex-wrap justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="min-h-[44px] rounded-lg border border-stone-300 bg-white px-4 py-2 text-sm font-medium text-stone-800 hover:bg-stone-50"
          >
            閉じる
          </button>
          <button
            type="button"
            onClick={onSelect}
            className="min-h-[44px] rounded-lg bg-emerald-800 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-900"
          >
            {selected ? "選択中のまま閉じる" : "このデザインにする"}
          </button>
        </div>
      </div>
    </div>
  );
}
