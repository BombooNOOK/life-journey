"use client";

import {
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";

const VIEWPORT_PAD_PX = 16;
const PANEL_GAP_PX = 6;
const PANEL_MAX_WIDTH_PX = 320;
const PANEL_MAX_WIDTH_SM_PX = 360;

type InlineHelpButtonProps = {
  /** 閉じているときの aria-label */
  ariaLabel?: string;
  children: ReactNode;
  buttonClassName?: string;
  /** 吹き出しの z-index（sticky 直上など） */
  panelZIndexClass?: string;
  /** 吹き出しの水平位置（画面端では viewport 内に収める） */
  panelAlign?: "center" | "start" | "end";
};

function panelWidthForViewport(): number {
  const max =
    typeof window !== "undefined" && window.matchMedia("(min-width: 640px)").matches
      ? PANEL_MAX_WIDTH_SM_PX
      : PANEL_MAX_WIDTH_PX;
  return Math.min(max, window.innerWidth - VIEWPORT_PAD_PX * 2);
}

function clampPanelLeft(
  rect: DOMRect,
  panelWidth: number,
  panelAlign: NonNullable<InlineHelpButtonProps["panelAlign"]>,
): number {
  const maxLeft = window.innerWidth - panelWidth - VIEWPORT_PAD_PX;
  let preferredLeft = rect.left;
  if (panelAlign === "center") {
    preferredLeft = rect.left + rect.width / 2 - panelWidth / 2;
  } else if (panelAlign === "end") {
    preferredLeft = rect.right - panelWidth;
  }
  return Math.min(Math.max(VIEWPORT_PAD_PX, preferredLeft), Math.max(VIEWPORT_PAD_PX, maxLeft));
}

export function InlineHelpButton({
  ariaLabel = "説明を表示",
  children,
  buttonClassName = "",
  panelZIndexClass = "z-50",
  panelAlign = "center",
}: InlineHelpButtonProps) {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [panelStyle, setPanelStyle] = useState<CSSProperties>({ visibility: "hidden" });
  const panelId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  const close = useCallback(() => setOpen(false), []);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: PointerEvent) => {
      if (rootRef.current?.contains(event.target as Node)) return;
      if (panelRef.current?.contains(event.target as Node)) return;
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

  const updatePanelPosition = useCallback(() => {
    const button = buttonRef.current;
    const panel = panelRef.current;
    if (!button || !panel) return;

    const rect = button.getBoundingClientRect();
    const width = panelWidthForViewport();
    const left = clampPanelLeft(rect, width, panelAlign);
    const top = rect.bottom + PANEL_GAP_PX;
    const maxTop = Math.max(
      VIEWPORT_PAD_PX,
      window.innerHeight - panel.offsetHeight - VIEWPORT_PAD_PX,
    );

    setPanelStyle({
      position: "fixed",
      top: Math.min(top, maxTop),
      left,
      width,
      visibility: "visible",
    });
  }, [panelAlign]);

  useLayoutEffect(() => {
    if (!open) {
      setPanelStyle({ visibility: "hidden" });
      return;
    }

    updatePanelPosition();
    window.addEventListener("resize", updatePanelPosition);
    window.addEventListener("scroll", updatePanelPosition, true);
    const vv = window.visualViewport;
    vv?.addEventListener("resize", updatePanelPosition);
    vv?.addEventListener("scroll", updatePanelPosition);

    return () => {
      window.removeEventListener("resize", updatePanelPosition);
      window.removeEventListener("scroll", updatePanelPosition, true);
      vv?.removeEventListener("resize", updatePanelPosition);
      vv?.removeEventListener("scroll", updatePanelPosition);
    };
  }, [open, updatePanelPosition]);

  const panel =
    open && mounted
      ? createPortal(
          <div
            ref={panelRef}
            id={panelId}
            role="region"
            style={panelStyle}
            className={[
              "box-border rounded-lg border border-stone-200/90 bg-[#faf8f5] p-3 text-left lj-read-desc text-stone-600 shadow-md",
              "whitespace-normal break-keep [overflow-wrap:break-word]",
              panelZIndexClass,
            ].join(" ")}
          >
            {children}
          </div>,
          document.body,
        )
      : null;

  return (
    <>
      <div ref={rootRef} className="relative inline-flex shrink-0 align-middle">
        <button
          ref={buttonRef}
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
      </div>
      {panel}
    </>
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
