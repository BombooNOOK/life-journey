"use client";

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { flushSync } from "react-dom";

import { JournalContentCharCountStickyBar } from "@/components/journal/JournalContentCharCountStickyBar";
import { JournalMobileInputMode } from "@/components/journal/JournalMobileInputMode";
import {
  CONTENT_FONT_MODE_LABELS_JA,
  type ContentFontMode,
} from "@/lib/journal/contentFontMode";
import { useTapWithoutScroll } from "@/hooks/useTapWithoutScroll";

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
  label: ReactNode;
  content: string;
  onContentChange: (value: string) => void;
  onContentFontModeChange: (mode: ContentFontMode) => void;
  recordPageTitle: string;
  bodyInputHeading: string;
  placeholder?: string;
  maxLength?: number;
  disabled?: boolean;
};

function useMobileLayout() {
  const [mobile, setMobile] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 639px)");
    const update = () => setMobile(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  return mobile;
}

export function JournalWritingComposer({
  label,
  content,
  onContentChange,
  onContentFontModeChange,
  bodyInputHeading,
  placeholder,
  maxLength = 2000,
  disabled = false,
  contentFontMode,
  ...counter
}: Props) {
  const mobile = useMobileLayout();
  const [inputModeOpen, setInputModeOpen] = useState(false);
  const inputModeTextareaRef = useRef<HTMLTextAreaElement>(null);

  const counterProps = { contentFontMode, ...counter };
  const hideNormalEntry = mobile && inputModeOpen;

  const focusInputModeTextarea = useCallback(() => {
    const el = inputModeTextareaRef.current;
    if (!el || disabled) return false;
    try {
      el.focus({ preventScroll: true });
    } catch {
      el.focus();
    }
    return document.activeElement === el;
  }, [disabled]);

  const openInputMode = useCallback(() => {
    if (disabled || inputModeOpen) return;
    flushSync(() => {
      setInputModeOpen(true);
    });
  }, [disabled, inputModeOpen]);

  const closeInputMode = useCallback(() => {
    setInputModeOpen(false);
    inputModeTextareaRef.current?.blur();
  }, []);

  const entryTap = useTapWithoutScroll(openInputMode, disabled || inputModeOpen);

  const displayText = content.trim();
  const showPlaceholder = !displayText;

  return (
    <div className="relative">
      {!hideNormalEntry ? label : null}

      <div className={hideNormalEntry ? "hidden" : "mt-1"} aria-hidden={hideNormalEntry}>
        {mobile ? (
          <div
            id="journal-content"
            role="button"
            tabIndex={disabled ? -1 : 0}
            aria-disabled={disabled}
            aria-label={`${bodyInputHeading}。タップして入力`}
            onKeyDown={(e) => {
              if (disabled) return;
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                openInputMode();
              }
            }}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
            }}
            {...entryTap}
            className={[
              "lj-read-diary w-full rounded-lg border border-stone-300 px-3 py-2.5 text-left leading-[1.6] touch-manipulation",
              "max-h-36 min-h-[6.5rem] overflow-y-auto",
              showPlaceholder ? "text-stone-400" : "whitespace-pre-wrap text-stone-900",
              disabled ? "opacity-50" : "cursor-text active:bg-stone-50/80",
            ].join(" ")}
          >
            {showPlaceholder ? placeholder : displayText}
          </div>
        ) : (
          <textarea
            id="journal-content"
            value={content}
            disabled={disabled}
            onChange={(e) => onContentChange(e.target.value)}
            maxLength={maxLength}
            rows={8}
            className="lj-read-diary w-full resize-none overflow-y-auto rounded-lg border border-stone-300 px-3 py-2.5 leading-[1.6] text-stone-900 outline-none ring-stone-400 focus:ring-2 sm:min-h-[10rem] sm:max-h-[20rem]"
            placeholder={placeholder}
          />
        )}
      </div>

      <JournalContentCharCountStickyBar {...counterProps} className="max-sm:hidden" />

      {mobile && !inputModeOpen ? (
        <p className="mt-1 text-[11px] tabular-nums text-stone-500 sm:hidden">
          {CONTENT_FONT_MODE_LABELS_JA[contentFontMode]}：{counterProps.charCount}/
          {counterProps.charMax}文字 · 本文{counterProps.bodyLineCount}/{counterProps.bodyMaxLines}行
        </p>
      ) : null}

      <JournalMobileInputMode
        open={mobile && inputModeOpen}
        onClose={closeInputMode}
        bodyInputHeading={bodyInputHeading}
        content={content}
        onContentChange={onContentChange}
        onContentFontModeChange={onContentFontModeChange}
        contentFontMode={contentFontMode}
        placeholder={placeholder}
        maxLength={maxLength}
        disabled={disabled}
        textareaRef={inputModeTextareaRef}
        {...counter}
      />
    </div>
  );
}
