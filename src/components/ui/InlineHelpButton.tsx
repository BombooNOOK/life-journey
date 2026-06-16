"use client";

import { useCallback, useEffect, useId, useRef, useState, type ReactNode } from "react";

type InlineHelpButtonProps = {
  /** 閉じているときの aria-label */
  ariaLabel?: string;
  children: ReactNode;
  buttonClassName?: string;
  /** 吹き出しの z-index（sticky 直上など） */
  panelZIndexClass?: string;
};

export function InlineHelpButton({
  ariaLabel = "説明を表示",
  children,
  buttonClassName = "",
  panelZIndexClass = "z-50",
}: InlineHelpButtonProps) {
  const [open, setOpen] = useState(false);
  const panelId = useId();
  const rootRef = useRef<HTMLDivElement>(null);

  const close = useCallback(() => setOpen(false), []);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: PointerEvent) => {
      if (rootRef.current?.contains(event.target as Node)) return;
      close();
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") close();
    };
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open, close]);

  return (
    <div ref={rootRef} className="relative inline-flex shrink-0 align-middle">
      <button
        type="button"
        aria-label={open ? "説明を閉じる" : ariaLabel}
        aria-expanded={open}
        aria-controls={open ? panelId : undefined}
        onClick={() => setOpen((prev) => !prev)}
        className={[
          "inline-flex h-5 w-5 items-center justify-center rounded-full border border-stone-300/90 bg-[#faf8f5] text-[11px] font-medium leading-none text-stone-500 transition",
          "hover:border-stone-400 hover:bg-white hover:text-stone-700",
          "focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/40",
          buttonClassName,
        ]
          .filter(Boolean)
          .join(" ")}
      >
        ?
      </button>
      {open ? (
        <div
          id={panelId}
          role="region"
          className={[
            "absolute top-[calc(100%+6px)] box-border rounded-lg border border-stone-200/90 bg-[#faf8f5] p-3 text-left lj-read-desc text-stone-600 shadow-md",
            "w-[min(320px,calc(100vw-32px))] max-w-[calc(100vw-32px)] sm:w-[min(360px,calc(100vw-32px))]",
            "whitespace-normal break-keep [overflow-wrap:break-word]",
            "left-1/2 -translate-x-1/2 sm:left-auto sm:right-0 sm:translate-x-0",
            panelZIndexClass,
          ].join(" ")}
        >
          {children}
        </div>
      ) : null}
    </div>
  );
}

type FieldLabelWithHelpProps = {
  label: string;
  help: ReactNode;
  htmlFor?: string;
  as?: "label" | "span";
  labelClassName?: string;
  helpAriaLabel?: string;
  panelZIndexClass?: string;
};

/** 見出し＋「？」を横並びにする */
export function FieldLabelWithHelp({
  label,
  help,
  htmlFor,
  as = "span",
  labelClassName = "text-sm font-medium text-stone-700",
  helpAriaLabel,
  panelZIndexClass,
}: FieldLabelWithHelpProps) {
  const labelProps =
    as === "label" && htmlFor != null ? ({ htmlFor } as { htmlFor: string }) : {};

  return (
    <div className="flex items-center gap-1.5">
      {as === "label" ? (
        <label className={labelClassName} {...labelProps}>
          {label}
        </label>
      ) : (
        <span className={labelClassName}>{label}</span>
      )}
      <InlineHelpButton
        ariaLabel={helpAriaLabel ?? `${label}の説明`}
        panelZIndexClass={panelZIndexClass}
      >
        {help}
      </InlineHelpButton>
    </div>
  );
}
