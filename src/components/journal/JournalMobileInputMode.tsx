"use client";

import { useEffect, useLayoutEffect, useRef, useState, type RefObject } from "react";
import { createPortal } from "react-dom";
import { flushSync } from "react-dom";

import {
  CONTENT_FONT_MODE_LABELS_JA,
  CONTENT_FONT_MODES,
  type ContentFontMode,
} from "@/lib/journal/contentFontMode";
import { getBodyFrameStatusLabel } from "@/lib/journal/diaryPreviewBodyLineLimits";
import { useVisualViewportDock } from "@/hooks/useVisualViewportDock";

type CounterProps = {
  contentFontMode: ContentFontMode;
  charCount: number;
  charMax: number;
  bodyLineCount: number;
  bodyMaxLines: number;
  bodyOverflows: boolean;
  commentOverflows: boolean;
};

type Props = CounterProps & {
  open: boolean;
  onClose: () => void;
  bodyInputHeading: string;
  content: string;
  onContentChange: (value: string) => void;
  onContentFontModeChange: (mode: ContentFontMode) => void;
  placeholder?: string;
  maxLength?: number;
  disabled?: boolean;
  textareaRef?: RefObject<HTMLTextAreaElement | null>;
};

type ShellAnchor = {
  top: number;
  left: number;
  width: number;
  height: number;
};

/** text-base + leading-relaxed の2行分（初回描画フォールバック） */
const TEXTAREA_TWO_LINE_MIN_PX_FALLBACK = 76;
const SHELL_TOP_NUDGE_PX = 10;

function measureTextareaTwoLineMinPx(textarea: HTMLTextAreaElement): number {
  const cs = getComputedStyle(textarea);
  const parsedLineHeight = Number.parseFloat(cs.lineHeight);
  const fontSize = Number.parseFloat(cs.fontSize) || 16;
  const lineHeight = Number.isFinite(parsedLineHeight) ? parsedLineHeight : fontSize * 1.625;
  const padY = Number.parseFloat(cs.paddingTop) + Number.parseFloat(cs.paddingBottom);
  const borderY = Number.parseFloat(cs.borderTopWidth) + Number.parseFloat(cs.borderBottomWidth);
  return Math.ceil(lineHeight * 2 + padY + borderY);
}

/**
 * スマホ向け入力モード。
 * visualViewport に合わせた1枚の執筆面。背面は inset-0 オーバーレイで覆う。
 */
export function JournalMobileInputMode({
  open,
  onClose,
  bodyInputHeading,
  content,
  onContentChange,
  onContentFontModeChange,
  placeholder,
  maxLength = 2000,
  disabled = false,
  textareaRef: textareaRefProp,
  contentFontMode,
  charCount,
  charMax,
  bodyLineCount,
  bodyMaxLines,
  bodyOverflows,
  commentOverflows,
}: Props) {
  const internalTextareaRef = useRef<HTMLTextAreaElement>(null);
  const textareaRef = textareaRefProp ?? internalTextareaRef;
  const lastTouchYRef = useRef<number | null>(null);
  const dock = useVisualViewportDock(open);
  const [twoLineMinPx, setTwoLineMinPx] = useState(TEXTAREA_TWO_LINE_MIN_PX_FALLBACK);
  const [compactFooter, setCompactFooter] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [shellAnchor, setShellAnchor] = useState<ShellAnchor | null>(null);

  const focusTextareaSoon = () => {
    const run = () => {
      const el = textareaRef.current;
      if (!el || document.activeElement === el) return;
      try {
        el.focus({ preventScroll: true });
      } catch {
        el.focus();
      }
    };
    window.requestAnimationFrame(run);
    window.setTimeout(run, 60);
  };

  const startEditing = () => {
    if (disabled) return;
    flushSync(() => {
      setIsEditing(true);
    });
    const el = textareaRef.current;
    if (el) {
      try {
        el.focus({ preventScroll: true });
      } catch {
        el.focus();
      }
    }
    focusTextareaSoon();
  };

  useLayoutEffect(() => {
    if (!open) return;

    const measure = () => {
      const textarea = textareaRef.current;
      const shell = document.getElementById("journal-input-mode-shell");
      const header = document.getElementById("journal-input-mode-header");
      const footer = document.getElementById("journal-input-mode-footer");
      if (!textarea) return;

      const minPx = measureTextareaTwoLineMinPx(textarea);
      setTwoLineMinPx(minPx);

      if (shell && header && footer) {
        const mainRowPadding = 12;
        const budget =
          shell.clientHeight - header.offsetHeight - footer.offsetHeight - mainRowPadding;
        setCompactFooter(budget < minPx * 1.1);
      }
    };

    measure();
    const rafId = window.requestAnimationFrame(measure);

    const shell = document.getElementById("journal-input-mode-shell");
    const resizeObserver =
      shell && typeof ResizeObserver !== "undefined"
        ? new ResizeObserver(() => measure())
        : null;
    if (shell && resizeObserver) {
      resizeObserver.observe(shell);
    }

    const vv = window.visualViewport;
    vv?.addEventListener("resize", measure);
    vv?.addEventListener("scroll", measure);
    window.addEventListener("resize", measure);

    return () => {
      window.cancelAnimationFrame(rafId);
      resizeObserver?.disconnect();
      vv?.removeEventListener("resize", measure);
      vv?.removeEventListener("scroll", measure);
      window.removeEventListener("resize", measure);
    };
  }, [open, dock.height, dock.bottomInset, textareaRef]);

  const modeLabel = CONTENT_FONT_MODE_LABELS_JA[contentFontMode];
  const frameOverflows = bodyOverflows || commentOverflows;
  const frameLabel = getBodyFrameStatusLabel(
    contentFontMode,
    bodyOverflows,
    commentOverflows,
  );

  useEffect(() => {
    if (!open) return;

    const prevHtmlOverflow = document.documentElement.style.overflow;
    const prevBodyOverflow = document.body.style.overflow;
    const prevBodyTouchAction = document.body.style.touchAction;
    const prevBodyPosition = document.body.style.position;
    const prevBodyTop = document.body.style.top;
    const prevBodyLeft = document.body.style.left;
    const prevBodyRight = document.body.style.right;
    const prevBodyWidth = document.body.style.width;
    const scrollY = window.scrollY;

    document.documentElement.style.overflow = "hidden";
    document.body.style.overflow = "hidden";
    document.body.style.touchAction = "none";
    document.body.style.position = "fixed";
    document.body.style.top = `-${scrollY}px`;
    document.body.style.left = "0";
    document.body.style.right = "0";
    document.body.style.width = "100%";

    return () => {
      document.documentElement.style.overflow = prevHtmlOverflow;
      document.body.style.overflow = prevBodyOverflow;
      document.body.style.touchAction = prevBodyTouchAction;
      document.body.style.position = prevBodyPosition;
      document.body.style.top = prevBodyTop;
      document.body.style.left = prevBodyLeft;
      document.body.style.right = prevBodyRight;
      document.body.style.width = prevBodyWidth;
      window.scrollTo(0, scrollY);
    };
  }, [open]);

  useEffect(() => {
    if (!open) {
      setIsEditing(false);
      setShellAnchor(null);
      return;
    }
  }, [open]);

  useEffect(() => {
    if (!open || isEditing || shellAnchor) return;
    if (dock.width <= 0 || dock.height <= 0) return;

    setShellAnchor({
      top: dock.offsetTop,
      left: dock.offsetLeft,
      width: dock.width,
      height: dock.height,
    });
  }, [open, isEditing, shellAnchor, dock.offsetTop, dock.offsetLeft, dock.width, dock.height]);

  useEffect(() => {
    if (!open || disabled || !isEditing) return;
    const lockScrollY = window.scrollY;
    const lockScrollX = window.scrollX;

    const id = window.requestAnimationFrame(() => {
      const el = textareaRef.current;
      if (!el || document.activeElement === el) return;
      try {
        el.focus({ preventScroll: true });
      } catch {
        el.focus();
      }
      // iOS が caret 表示のために自動スクロールした場合の揺れ戻し。
      window.scrollTo(lockScrollX, lockScrollY);
      window.requestAnimationFrame(() => {
        window.scrollTo(lockScrollX, lockScrollY);
      });
    });
    return () => window.cancelAnimationFrame(id);
  }, [open, disabled, textareaRef, isEditing]);

  useEffect(() => {
    if (!open || !isEditing) return;

    const lockScrollX = window.scrollX;
    const lockScrollY = window.scrollY;
    const keepViewportScrollLocked = () => {
      if (window.scrollX !== lockScrollX || window.scrollY !== lockScrollY) {
        window.scrollTo(lockScrollX, lockScrollY);
      }
    };

    const vv = window.visualViewport;
    window.addEventListener("scroll", keepViewportScrollLocked);
    vv?.addEventListener("scroll", keepViewportScrollLocked);
    vv?.addEventListener("resize", keepViewportScrollLocked);

    return () => {
      window.removeEventListener("scroll", keepViewportScrollLocked);
      vv?.removeEventListener("scroll", keepViewportScrollLocked);
      vv?.removeEventListener("resize", keepViewportScrollLocked);
    };
  }, [open, isEditing]);

  useEffect(() => {
    if (!open) return;
    const shell = document.getElementById("journal-input-mode-shell");
    const backdrop = document.getElementById("journal-input-mode-backdrop");
    if (!shell) return;

    const isTextareaTarget = (target: EventTarget | null): boolean => {
      if (!(target instanceof Node)) return false;
      const textarea = textareaRef.current;
      return Boolean(textarea && (target === textarea || textarea.contains(target)));
    };

    const onTouchStart = (e: TouchEvent) => {
      lastTouchYRef.current = e.touches[0]?.clientY ?? null;
    };

    const onTouchMove = (e: TouchEvent) => {
      const textarea = textareaRef.current;
      if (!isTextareaTarget(e.target) || !textarea) {
        e.preventDefault();
        return;
      }

      const scrollable = textarea.scrollHeight > textarea.clientHeight + 1;
      if (!scrollable) {
        e.preventDefault();
        return;
      }

      const currentY = e.touches[0]?.clientY ?? null;
      const lastY = lastTouchYRef.current;
      lastTouchYRef.current = currentY;
      if (currentY == null || lastY == null) return;

      const deltaY = currentY - lastY;
      const movingDown = deltaY > 0;
      const movingUp = deltaY < 0;
      const atTop = textarea.scrollTop <= 0;
      const atBottom =
        textarea.scrollTop + textarea.clientHeight >= textarea.scrollHeight - 1;

      if ((movingDown && atTop) || (movingUp && atBottom)) {
        e.preventDefault();
      }
    };

    const options: AddEventListenerOptions = { passive: false };
    shell.addEventListener("touchstart", onTouchStart, options);
    shell.addEventListener("touchmove", onTouchMove, options);
    backdrop?.addEventListener("touchstart", onTouchStart, options);
    backdrop?.addEventListener("touchmove", onTouchMove, options);

    return () => {
      shell.removeEventListener("touchstart", onTouchStart, options);
      shell.removeEventListener("touchmove", onTouchMove, options);
      backdrop?.removeEventListener("touchstart", onTouchStart, options);
      backdrop?.removeEventListener("touchmove", onTouchMove, options);
      lastTouchYRef.current = null;
    };
  }, [open, textareaRef]);

  if (!open || typeof document === "undefined") return null;

  const shellWidth =
    shellAnchor?.width ??
    (dock.width > 0 ? dock.width : typeof window !== "undefined" ? window.innerWidth : undefined);
  const shellHeight =
    shellAnchor?.height ??
    (dock.height > 0 ? dock.height : typeof window !== "undefined" ? window.innerHeight : undefined);

  const keyboardLikelyOpen =
    typeof window !== "undefined" &&
    dock.height > 0 &&
    dock.height < window.innerHeight * 0.82;
  const keyboardAccessoryInsetPx = keyboardLikelyOpen ? 28 : 0;

  const shellTop = (shellAnchor?.top ?? dock.offsetTop) + SHELL_TOP_NUDGE_PX;
  const shellGridRows = isEditing
    ? `auto ${twoLineMinPx}px auto`
    : `auto minmax(${twoLineMinPx}px, 1fr) auto`;

  const shellStyle = {
    left: shellAnchor?.left ?? dock.offsetLeft,
    top: shellTop,
    width: shellWidth,
    height: shellHeight,
    maxHeight: shellHeight,
    gridTemplateRows: shellGridRows,
    alignContent: isEditing ? ("start" as const) : undefined,
    overscrollBehavior: "contain" as const,
  };

  return createPortal(
    <>
      <div
        id="journal-input-mode-backdrop"
        className="fixed inset-0 z-[9998] touch-none bg-[#faf8f5]"
        aria-hidden
      />
      <div
        id="journal-input-mode-shell"
        className="fixed z-[9999] grid overflow-hidden overscroll-contain bg-[#faf8f5] text-stone-900 touch-none"
        style={shellStyle}
        role="dialog"
        aria-modal="true"
        aria-labelledby="journal-input-mode-title"
      >
        <header
          id="journal-input-mode-header"
          className="flex shrink-0 items-center gap-1.5 border-b border-stone-200/90 px-3 py-1.5"
        >
          <p
            id="journal-input-mode-title"
            className="min-w-0 flex-1 truncate text-xs font-semibold text-stone-800"
          >
            {bodyInputHeading}
          </p>
        </header>

        <div className="min-h-0 overflow-hidden px-2 pb-1.5 pt-1">
          {isEditing ? (
            <textarea
              id="journal-input-mode-textarea"
              ref={textareaRef}
              enterKeyHint="done"
              value={content}
              disabled={disabled}
              onFocus={() => {
                const lockScrollX = window.scrollX;
                const lockScrollY = window.scrollY;
                window.scrollTo(lockScrollX, lockScrollY);
                window.requestAnimationFrame(() => {
                  window.scrollTo(lockScrollX, lockScrollY);
                });
              }}
              onChange={(e) => onContentChange(e.target.value)}
              maxLength={maxLength}
              placeholder={placeholder}
              className="box-border min-h-0 w-full resize-none overflow-y-auto overscroll-y-contain rounded-lg border border-stone-200 bg-white px-3 py-2 text-base leading-relaxed text-stone-900 outline-none ring-stone-400 focus:ring-2 touch-auto"
              style={{
                WebkitOverflowScrolling: "touch",
                height: twoLineMinPx,
                minHeight: twoLineMinPx,
                maxHeight: twoLineMinPx,
              }}
            />
          ) : (
            <button
              type="button"
              onClick={startEditing}
              className="box-border flex h-full min-h-0 w-full items-start overflow-y-auto rounded-lg border border-stone-200 bg-white px-3 py-2 text-left text-base leading-relaxed text-stone-900"
            >
              {content.trim() ? (
                <span className="block w-full whitespace-pre-wrap">{content.trim()}</span>
              ) : (
                <span className="block w-full text-stone-400">{placeholder}</span>
              )}
            </button>
          )}
        </div>

        <footer
          id="journal-input-mode-footer"
          className={[
            "min-h-0 shrink-0 border-t border-stone-200/90 bg-[#faf8f5] px-3",
            compactFooter ? "py-1" : "py-1.5",
          ].join(" ")}
          style={{
            paddingBottom: `calc(env(safe-area-inset-bottom,0px) + ${keyboardAccessoryInsetPx + 4}px)`,
          }}
        >
          <div id="journal-input-mode-counter">
            <p className="text-xs font-semibold tabular-nums leading-snug text-stone-900">
              {modeLabel}：{charCount}/{charMax}文字
              <span className="mx-1.5 font-normal text-stone-400">·</span>
              本文行数：{bodyLineCount}/{bodyMaxLines}行
            </p>
            {frameOverflows ? (
              <p className="mt-0.5 text-[10px] font-medium leading-tight text-amber-800">
                {frameLabel}
              </p>
            ) : null}
          </div>

          <div
            className={[
              "flex flex-wrap",
              compactFooter ? "mt-1 gap-0.5" : "mt-1.5 gap-1",
            ].join(" ")}
            role="group"
            aria-label="文字サイズ"
          >
            {CONTENT_FONT_MODES.map((mode) => {
              const selected = contentFontMode === mode;
              return (
                <button
                  key={mode}
                  type="button"
                  aria-pressed={selected}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => onContentFontModeChange(mode)}
                  className={[
                    "rounded-full border px-2 font-medium leading-tight",
                    compactFooter ? "py-0 text-[9px]" : "py-0.5 text-[10px]",
                    selected
                      ? "border-emerald-600 bg-emerald-50 text-emerald-950"
                      : "border-stone-200 bg-white text-stone-700",
                  ].join(" ")}
                >
                  {CONTENT_FONT_MODE_LABELS_JA[mode]}
                </button>
              );
            })}
          </div>

          <div className={compactFooter ? "mt-1 flex justify-end" : "mt-1.5 flex justify-end"}>
            <button
              type="button"
              onClick={onClose}
              className={[
                "rounded-lg bg-stone-800 px-4 text-sm font-semibold text-white",
                compactFooter ? "py-1.5" : "py-2",
              ].join(" ")}
            >
              完了
            </button>
          </div>
        </footer>
      </div>
    </>,
    document.body,
  );
}
