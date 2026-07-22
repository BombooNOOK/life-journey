"use client";

import Image from "next/image";
import { useEffect, useId, useState } from "react";

import {
  ashiatoPageTemplateContentLabel,
  ashiatoPageTemplateOptions,
  ashiatoPageTemplatePreviewPath,
  type AshiatoPageTemplateId,
} from "@/lib/journal/ashiatoPageTemplates";

type Props = {
  value: AshiatoPageTemplateId;
  onChange: (id: AshiatoPageTemplateId) => void;
};

export function AshiatoPageShapePicker({ value, onChange }: Props) {
  const [previewId, setPreviewId] = useState<AshiatoPageTemplateId | null>(null);

  return (
    <div className="block text-sm">
      <span className="mb-1 block font-medium text-stone-800">ページのかたちを選ぶ</span>
      <p className="mb-3 text-xs leading-relaxed text-stone-600">
        ページのかたちによって、入る内容が変わります。
        <br />
        シンプルに思い出として残したい方は、「森の絵日記」や「森の余白ノート」を。
        <br />
        すうじや鑑定士の読み解きも一緒に残したい方は、「すうじとあしあと」や「すうじとあしあと
        彩り」を選んでください。
      </p>

      <div className="grid gap-3 sm:grid-cols-2">
        {ashiatoPageTemplateOptions.map((opt) => {
          const selected = value === opt.id;
          return (
            <div
              key={opt.id}
              className={`rounded-xl border-2 p-3 transition ${
                selected
                  ? "border-emerald-600 bg-emerald-50/80 ring-2 ring-emerald-200"
                  : "border-stone-200 bg-white"
              }`}
            >
              <div className="relative mx-auto aspect-[721/1024] w-full max-w-[9rem] overflow-hidden rounded-md border border-stone-200 bg-stone-100">
                <Image
                  src={ashiatoPageTemplatePreviewPath(opt.id)}
                  alt={`${opt.label}のプレビュー`}
                  fill
                  className="object-contain"
                  sizes="144px"
                  unoptimized
                />
              </div>
              <p className="mt-2 text-sm font-semibold text-stone-900">{opt.label}</p>
              <p className="mt-0.5 text-[11px] text-stone-500">{opt.category}</p>
              <p className="mt-1.5 line-clamp-3 text-xs leading-relaxed text-stone-600">
                {opt.description}
              </p>
              <div className="mt-2 flex flex-wrap gap-1">
                {opt.badges.map((badge) => (
                  <span
                    key={badge}
                    className={
                      badge === "右とじ"
                        ? "rounded-full border border-rose-300 bg-rose-100 px-1.5 py-0.5 text-[10px] font-semibold text-rose-900"
                        : "rounded-full border border-emerald-200/80 bg-emerald-50 px-1.5 py-0.5 text-[10px] font-medium text-emerald-900"
                    }
                  >
                    {badge}
                  </span>
                ))}
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setPreviewId(opt.id)}
                  className="rounded-lg border border-stone-300 bg-white px-2.5 py-1.5 text-xs font-medium text-stone-800 hover:bg-stone-50"
                >
                  大きく見る
                </button>
                <button
                  type="button"
                  aria-pressed={selected}
                  onClick={() => onChange(opt.id)}
                  className={`rounded-lg px-2.5 py-1.5 text-xs font-medium ${
                    selected
                      ? "bg-emerald-800 text-white"
                      : "border border-emerald-300 bg-emerald-50 text-emerald-950 hover:bg-emerald-100"
                  }`}
                >
                  {selected ? "選択中" : "このかたちにする"}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {previewId ? (
        <AshiatoPageShapePreviewModal
          templateId={previewId}
          selectedId={value}
          onSelect={(id) => {
            onChange(id);
            setPreviewId(null);
          }}
          onClose={() => setPreviewId(null)}
        />
      ) : null}
    </div>
  );
}

function AshiatoPageShapePreviewModal({
  templateId,
  selectedId,
  onSelect,
  onClose,
}: {
  templateId: AshiatoPageTemplateId;
  selectedId: AshiatoPageTemplateId;
  onSelect: (id: AshiatoPageTemplateId) => void;
  onClose: () => void;
}) {
  const titleId = useId();
  const opt = ashiatoPageTemplateOptions.find((o) => o.id === templateId)!;
  const isSelected = selectedId === templateId;

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-stone-900/50 p-3 sm:items-center sm:p-6"
      role="presentation"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-stone-200 bg-[#faf8f5] p-4 shadow-xl sm:p-5"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 id={titleId} className="text-base font-semibold text-stone-900">
          {opt.label}
        </h3>
        <p className="mt-0.5 text-xs text-stone-500">{opt.category}</p>

        <div className="relative mx-auto mt-3 aspect-[721/1024] w-full max-w-sm overflow-hidden rounded-xl border border-stone-200 bg-white">
          <Image
            src={ashiatoPageTemplatePreviewPath(opt.id)}
            alt={`${opt.label}の大きめプレビュー`}
            fill
            className="object-contain"
            sizes="(max-width: 640px) 90vw, 24rem"
            unoptimized
            priority
          />
        </div>

        <p className="mt-3 text-sm leading-relaxed text-stone-700">{opt.description}</p>

        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <div>
            <p className="text-xs font-semibold text-stone-800">入る内容</p>
            <ul className="mt-1 list-inside list-disc text-xs text-stone-600">
              {opt.includes.map((key) => (
                <li key={key}>{ashiatoPageTemplateContentLabel(key)}</li>
              ))}
            </ul>
          </div>
          {opt.excludes.length > 0 ? (
            <div>
              <p className="text-xs font-semibold text-stone-800">入らない内容</p>
              <ul className="mt-1 list-inside list-disc text-xs text-stone-600">
                {opt.excludes.map((key) => (
                  <li key={key}>{ashiatoPageTemplateContentLabel(key)}</li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>

        <div className="mt-3 flex flex-wrap gap-1">
          {opt.badges.map((badge) => (
            <span
              key={badge}
              className={
                badge === "右とじ"
                  ? "rounded-full border border-rose-300 bg-rose-100 px-1.5 py-0.5 text-[10px] font-semibold text-rose-900"
                  : "rounded-full border border-emerald-200/80 bg-emerald-50 px-1.5 py-0.5 text-[10px] font-medium text-emerald-900"
              }
            >
              {badge}
            </span>
          ))}
        </div>

        <p className="mt-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs leading-relaxed text-amber-950">
          {opt.notice}
        </p>

        <div className="mt-4 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => onSelect(opt.id)}
            className="rounded-lg bg-emerald-800 px-3 py-2 text-sm font-medium text-white hover:bg-emerald-900"
          >
            {isSelected ? "このかたちで続ける" : "このかたちにする"}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm font-medium text-stone-800 hover:bg-stone-50"
          >
            戻る
          </button>
        </div>
      </div>
    </div>
  );
}
