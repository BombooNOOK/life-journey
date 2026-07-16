"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useId, useState } from "react";

import { ReadingFontSizeControl } from "@/components/reading/ReadingFontSizeControl";
import {
  DAILY_FORTUNE_BG_INTRINSIC,
  DAILY_FORTUNE_BG_SRC,
} from "@/lib/ljd/dailyFortuneAssets";
import {
  DAILY_FORTUNE_HELP_BODY,
  DAILY_FORTUNE_HELP_BUTTON_LABEL,
  DAILY_FORTUNE_HELP_DISMISS,
  DAILY_FORTUNE_HELP_TITLE,
  DAILY_FORTUNE_THEME_BUTTON_LABEL,
  DAILY_FORTUNE_THEME_DISMISS,
  DAILY_FORTUNE_THEME_MODAL_TITLE,
  DAILY_FORTUNE_THEME_PREPARING,
  dailyFortuneGuideAnnouncement,
} from "@/lib/ljd/dailyFortuneCopy";
import type { DailyFortuneColorAsset } from "@/lib/ljd/dailyFortuneColors";
import type { DailyFortuneGuide } from "@/lib/ljd/dailyFortuneGuides";
import {
  DAILY_FORTUNE_LAYOUT,
  dailyFortuneRectStyle,
  dailyFortuneStageContainStyle,
  dailyFortuneStageFillParentStyle,
  type DailyFortuneLayoutSlotId,
  type DailyFortunePercentRect,
} from "@/lib/ljd/dailyFortuneLayout";
import { LOG_HOUSE_BACK_TO_LINK_LABEL } from "@/lib/journal/logHouseLabels";

export type DailyFortuneThemeBlock = {
  title: string;
  headline: string | null;
  body: string | null;
};

type Props = {
  guide: DailyFortuneGuide;
  message: string;
  smallAction: string;
  color: DailyFortuneColorAsset;
  yearTheme: DailyFortuneThemeBlock;
  monthTheme: DailyFortuneThemeBlock;
  /** プレビュー時など戻り先を差し替える */
  backHref?: string;
  backLabel?: string;
  /** レイアウト定規からの下書き */
  layoutOverride?: Partial<Record<DailyFortuneLayoutSlotId, DailyFortunePercentRect>>;
  /** 定規埋め込み時は上部Chromeを隠す */
  hideChrome?: boolean;
  /** 親幅いっぱいにステージを広げる（定規用） */
  fillParent?: boolean;
  /** ステージ上に重ねる追加UI（定規オーバーレイなど） */
  stageOverlay?: React.ReactNode;
};

function HelpHintIcon() {
  return (
    <svg aria-hidden className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <circle cx="12" cy="12" r="9" />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M9.2 9.2a2.9 2.9 0 0 1 5.6 1c0 2-2.9 2.5-2.9 4.3"
      />
      <circle cx="12" cy="17" r="0.95" fill="currentColor" stroke="none" />
    </svg>
  );
}

const chromeBackClass = [
  "pointer-events-auto inline-flex min-h-11 items-center rounded-full",
  "border border-[#d9cbb8]/90 bg-[#fffdf8]/90 px-3 text-sm font-medium text-[#5c4a3a]",
  "shadow-sm backdrop-blur-[3px]",
].join(" ");

const chromeHelpClass = [
  "pointer-events-auto inline-flex h-11 w-11 items-center justify-center rounded-full",
  "border border-[#d9cbb8]/90 bg-[#fffdf8]/90 text-[#5c4a3a]",
  "shadow-sm backdrop-blur-[3px] transition hover:bg-[#fffdf8] active:scale-[0.98]",
].join(" ");

function PaperModal({
  titleId,
  title,
  children,
  dismissLabel,
  onClose,
}: {
  titleId: string;
  title: string;
  children: React.ReactNode;
  dismissLabel: string;
  onClose: () => void;
}) {
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center px-4 py-8">
      <button
        type="button"
        className="absolute inset-0 bg-stone-950/45"
        aria-label="閉じる"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="relative z-[1] w-full max-w-sm rounded-2xl border border-[#e4d8c6] bg-[#fffdf8] px-5 py-5 shadow-[0_12px_40px_rgba(40,28,16,0.28)]"
      >
        <h2 id={titleId} className="text-base font-semibold tracking-wide text-[#3f3428]">
          {title}
        </h2>
        <div className="mt-3 text-sm leading-relaxed text-[#4f4033]">{children}</div>
        <button
          type="button"
          onClick={onClose}
          className="mt-5 inline-flex min-h-11 w-full items-center justify-center rounded-xl border border-[#d9cbb8] bg-[#f7f0e4] px-4 text-sm font-medium text-[#5c4a3a] shadow-sm transition hover:bg-[#f3ebe0] active:scale-[0.99]"
        >
          {dismissLabel}
        </button>
      </div>
    </div>
  );
}

function themeLines(block: DailyFortuneThemeBlock) {
  const headline = block.headline?.trim();
  const body = block.body?.trim();
  if (!headline && !body) {
    return { headline: DAILY_FORTUNE_THEME_PREPARING, body: null as string | null };
  }
  return {
    headline: headline || DAILY_FORTUNE_THEME_PREPARING,
    body: body || null,
  };
}

/** 今日の鑑定結果：背景ベースの没入UI */
export function DailyFortunePageClient({
  guide,
  message,
  smallAction,
  color,
  yearTheme,
  monthTheme,
  backHref = "/orders",
  backLabel = LOG_HOUSE_BACK_TO_LINK_LABEL,
  layoutOverride,
  hideChrome = false,
  fillParent = false,
  stageOverlay = null,
}: Props) {
  const helpTitleId = useId();
  const themeTitleId = useId();
  const [helpOpen, setHelpOpen] = useState(false);
  const [themeOpen, setThemeOpen] = useState(false);
  const layout = { ...DAILY_FORTUNE_LAYOUT, ...layoutOverride };

  const closeHelp = useCallback(() => setHelpOpen(false), []);
  const closeTheme = useCallback(() => setThemeOpen(false), []);

  const yearLines = themeLines(yearTheme);
  const monthLines = themeLines(monthTheme);

  return (
    <div
      className={[
        "relative isolate w-full overflow-x-hidden overflow-y-auto",
        hideChrome ? "min-h-0" : "min-h-[100dvh]",
      ].join(" ")}
      style={{ backgroundColor: "#ebe4d4" }}
    >
      {hideChrome ? null : (
        <div className="pointer-events-none absolute inset-x-0 top-0 z-40 flex items-start justify-between gap-3 px-3 pb-2 pt-[max(0.75rem,env(safe-area-inset-top))]">
          <Link href={backHref} className={chromeBackClass}>
            {backLabel}
          </Link>
          <button
            type="button"
            className={chromeHelpClass}
            aria-label={DAILY_FORTUNE_HELP_BUTTON_LABEL}
            title={DAILY_FORTUNE_HELP_BUTTON_LABEL}
            onClick={() => setHelpOpen(true)}
          >
            <HelpHintIcon />
          </button>
        </div>
      )}

      <div
        className={[
          "flex items-center justify-center px-0 py-0",
          hideChrome ? "min-h-0" : "min-h-[100dvh]",
        ].join(" ")}
      >
        <div
          className="relative isolate overflow-hidden"
          style={fillParent ? dailyFortuneStageFillParentStyle() : dailyFortuneStageContainStyle()}
        >
          <Image
            src={DAILY_FORTUNE_BG_SRC}
            alt=""
            fill
            priority
            unoptimized
            sizes="100vw"
            className="object-contain object-center"
          />

          <div
            className="pointer-events-none absolute z-[2]"
            style={dailyFortuneRectStyle(layout.guideCharacter)}
            aria-hidden
          >
            <Image
              src={guide.imageSrc}
              alt=""
              fill
              unoptimized
              sizes="30vw"
              className="object-contain object-bottom [mix-blend-mode:screen]"
            />
          </div>

          <p
            className="lj-reading-exempt pointer-events-none absolute z-[3] flex items-center justify-center whitespace-pre-line text-center text-[0.72rem] font-normal leading-snug text-[#9a8b78] [text-shadow:0_1px_0_rgba(255,251,245,0.45)] sm:text-[0.78rem]"
            style={dailyFortuneRectStyle(layout.guideText)}
          >
            {dailyFortuneGuideAnnouncement(guide.name)}
          </p>

          <p
            id="today-hint"
            className="pointer-events-none absolute z-[3] flex items-center justify-center px-1.5 text-center text-[1.05rem] font-medium leading-snug text-[#3f3428]"
            style={dailyFortuneRectStyle(layout.message)}
          >
            {message}
          </p>

          <p
            id="guardian-color"
            className="pointer-events-none absolute z-[3] flex items-center justify-center text-center text-[1.2rem] font-semibold text-[#5c3d28]"
            style={dailyFortuneRectStyle(layout.colorLabel)}
          >
            {color.label}
          </p>

          <div
            className="pointer-events-none absolute z-[3]"
            style={dailyFortuneRectStyle(layout.colorPalette)}
            aria-hidden
          >
            <Image
              src={color.paletteSrc}
              alt=""
              fill
              unoptimized
              sizes="20vw"
              className="object-contain [mix-blend-mode:screen]"
            />
          </div>

          <div
            className="pointer-events-none absolute z-[3]"
            style={dailyFortuneRectStyle(layout.colorMotif)}
            aria-hidden
          >
            <Image
              src={color.motifSrc}
              alt=""
              fill
              unoptimized
              sizes="28vw"
              className="object-contain [mix-blend-mode:screen]"
            />
          </div>

          <p
            className="pointer-events-none absolute z-[3] flex items-center justify-center whitespace-normal px-1.5 text-center text-[1.05rem] font-medium leading-snug text-[#3f3428]"
            style={dailyFortuneRectStyle(layout.smallAction)}
          >
            {smallAction}
          </p>

          <button
            type="button"
            className="absolute z-[4] rounded-full focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#6b5d4a]"
            style={dailyFortuneRectStyle(layout.themeButton)}
            aria-label={DAILY_FORTUNE_THEME_BUTTON_LABEL}
            onClick={() => setThemeOpen(true)}
          />

          <span className="sr-only">
            設計サイズ {DAILY_FORTUNE_BG_INTRINSIC.widthPx}×{DAILY_FORTUNE_BG_INTRINSIC.heightPx}
          </span>
          {stageOverlay}
        </div>
      </div>

      {hideChrome ? null : (
        <div className="pointer-events-none absolute inset-x-0 bottom-0 z-40 px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
          <div className="pointer-events-auto mx-auto w-full max-w-[17rem] rounded-full border border-[#d9cbb8]/90 bg-[#fffdf8]/92 px-3 py-2 shadow-sm backdrop-blur-[2px]">
            <ReadingFontSizeControl variant="hero" comfortable />
          </div>
        </div>
      )}

      {helpOpen ? (
        <PaperModal
          titleId={helpTitleId}
          title={DAILY_FORTUNE_HELP_TITLE}
          dismissLabel={DAILY_FORTUNE_HELP_DISMISS}
          onClose={closeHelp}
        >
          <p className="lj-read-desc whitespace-pre-line">{DAILY_FORTUNE_HELP_BODY}</p>
        </PaperModal>
      ) : null}

      {themeOpen ? (
        <PaperModal
          titleId={themeTitleId}
          title={DAILY_FORTUNE_THEME_MODAL_TITLE}
          dismissLabel={DAILY_FORTUNE_THEME_DISMISS}
          onClose={closeTheme}
        >
          <div id="year-theme" className="lj-read-desc space-y-1">
            <h3 className="text-sm font-semibold text-[#5c4a3a]">{yearTheme.title}</h3>
            <p className="font-medium text-[#3f3428]">{yearLines.headline}</p>
            {yearLines.body ? (
              <p className="whitespace-pre-line text-[#5a4a3c]">{yearLines.body}</p>
            ) : null}
          </div>
          <div id="month-theme" className="lj-read-desc mt-4 space-y-1 border-t border-[#e4d8c6] pt-4">
            <h3 className="text-sm font-semibold text-[#5c4a3a]">{monthTheme.title}</h3>
            <p className="font-medium text-[#3f3428]">{monthLines.headline}</p>
            {monthLines.body ? (
              <p className="whitespace-pre-line text-[#5a4a3c]">{monthLines.body}</p>
            ) : null}
          </div>
        </PaperModal>
      ) : null}
    </div>
  );
}
