"use client";

import { useEffect, useId } from "react";

export type DonguriFootprintModalAction = {
  label: string;
  onClick: () => void;
  variant?: "primary" | "secondary" | "ghost";
  disabled?: boolean;
};

type Props = {
  open: boolean;
  title: string;
  body: string;
  actions: DonguriFootprintModalAction[];
  onDismiss?: () => void;
};

export function DonguriFootprintModal({ open, title, body, actions, onDismiss }: Props) {
  const titleId = useId();

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onDismiss?.();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open, onDismiss]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/40 p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onDismiss?.();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="w-full max-w-md rounded-xl border border-stone-200 bg-white p-5 shadow-lg"
      >
        <h2 id={titleId} className="text-base font-semibold text-stone-900">
          {title}
        </h2>
        <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-stone-700">{body}</p>
        <div className="mt-5 flex flex-col gap-2">
          {actions.map((action) => {
            const base =
              "min-h-[44px] rounded-lg px-4 py-2.5 text-sm font-medium disabled:opacity-60";
            const variantClass =
              action.variant === "primary"
                ? "bg-[#b8893d] text-white hover:bg-[#a67a32]"
                : action.variant === "ghost"
                  ? "border border-transparent text-stone-600 hover:bg-stone-50"
                  : "border border-stone-200 text-stone-700 hover:bg-stone-50";
            return (
              <button
                key={action.label}
                type="button"
                disabled={action.disabled}
                onClick={action.onClick}
                className={`${base} ${variantClass}`}
              >
                {action.label}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
