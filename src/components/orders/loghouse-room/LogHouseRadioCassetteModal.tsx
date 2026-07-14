"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState, type ReactNode } from "react";

import {
  findLogHouseRadioCassette,
  LOG_HOUSE_RADIO_BUTTON_ASSETS,
  LOG_HOUSE_RADIO_CASSETTE_ICON_SRC,
  LOG_HOUSE_RADIO_CASSETTES,
  LOG_HOUSE_RADIO_CLOSE_LABEL,
  LOG_HOUSE_RADIO_CURRENT_BADGE,
  LOG_HOUSE_RADIO_DEFAULT_CASSETTE_ID,
  LOG_HOUSE_RADIO_EYEBROW,
  LOG_HOUSE_RADIO_INSERT_LABEL,
  LOG_HOUSE_RADIO_JACKET_FALLBACK_LABEL,
  LOG_HOUSE_RADIO_MUSIC_HALL_LINK_LABEL,
  LOG_HOUSE_RADIO_NOW_LABEL,
  LOG_HOUSE_RADIO_PANEL_WOOD_INTRINSIC,
  LOG_HOUSE_RADIO_PANEL_WOOD_SRC,
  LOG_HOUSE_RADIO_PICKER_TITLE,
  LOG_HOUSE_RADIO_PLAY_PAUSE_LABEL,
  LOG_HOUSE_RADIO_PREPARING_NOTE,
  LOG_HOUSE_RADIO_REPEAT_ALL_LABEL,
  LOG_HOUSE_RADIO_REPEAT_ONE_LABEL,
  LOG_HOUSE_RADIO_SLEEP_TIMER_LABEL,
  LOG_HOUSE_RADIO_SLEEP_TIMER_OPTIONS,
  LOG_HOUSE_RADIO_STOP_LABEL,
  LOG_HOUSE_RADIO_SWAP_LABEL,
  LOG_HOUSE_RADIO_TIMER_BUTTON_LABEL,
  LOG_HOUSE_RADIO_TITLE,
  logHouseRadioMusicHallHref,
  logHouseRadioPlaybackStatusLabel,
  type LogHouseRadioCassette,
  type LogHouseRadioRepeatMode,
  type LogHouseRadioSleepTimerMinutes,
} from "@/lib/loghouse/logHouseRadioCassette";

type Props = {
  open: boolean;
  onClose: () => void;
  /** 音楽堂リンク。省略時はログハウス（/orders）へ戻る */
  musicHallHref?: string;
};

type PanelView = "player" | "picker";

function LeafMark({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden
      className={className}
      fill="none"
    >
      <path
        d="M5 18c6-1 10-5 12-12 0 0-7 1-11 6-2 2.5-2.5 5-1 6Z"
        fill="currentColor"
        opacity="0.85"
      />
      <path
        d="M7.2 16.8c2.4-2.1 5.3-3.8 9.3-4.6"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinecap="round"
        opacity="0.55"
      />
    </svg>
  );
}

/** カセットジャケット（いまのカセット枠・所持一覧で共通） */
function CassetteJacketThumb({
  cassette,
  sizeClass = "h-[4.4rem] w-[4.4rem]",
}: {
  cassette: Pick<LogHouseRadioCassette, "title" | "jacketSrc">;
  sizeClass?: string;
}) {
  return (
    <div
      className={[
        "relative shrink-0 overflow-hidden rounded-xl border border-[#e0d2bc]/95 bg-[#efe6d6] shadow-inner",
        sizeClass,
      ].join(" ")}
      aria-hidden={!cassette.jacketSrc}
    >
      {cassette.jacketSrc ? (
        <Image
          src={cassette.jacketSrc}
          alt=""
          fill
          className="object-cover"
          sizes="88px"
          unoptimized
        />
      ) : (
        <div className="flex h-full w-full flex-col items-center justify-center gap-1 px-1 text-center">
          <Image
            src={LOG_HOUSE_RADIO_CASSETTE_ICON_SRC}
            alt=""
            width={48}
            height={34}
            className="h-7 w-auto object-contain opacity-80"
            unoptimized
          />
          <span className="text-[8px] font-medium leading-tight text-[#8a7762]/90">
            {LOG_HOUSE_RADIO_JACKET_FALLBACK_LABEL}
          </span>
        </div>
      )}
      <span className="sr-only">{cassette.title}のジャケット</span>
    </div>
  );
}

function PhysicalButton({
  src,
  label,
  pressed,
  onClick,
  className = "",
  imageClassName = "",
}: {
  src: string;
  label: string;
  pressed?: boolean;
  onClick: () => void;
  className?: string;
  imageClassName?: string;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      aria-pressed={pressed}
      onClick={onClick}
      className={[
        "group flex flex-col items-center gap-0.5 text-center transition active:scale-[0.97]",
        className,
      ].join(" ")}
    >
      <span
        className={[
          "relative mx-auto block w-[78%] drop-shadow-[0_4px_8px_rgba(20,12,6,0.32)] transition",
          pressed ? "brightness-[0.9] saturate-[1.08]" : "group-hover:brightness-[1.04]",
          pressed ? "translate-y-[1px]" : "",
        ].join(" ")}
      >
        <Image
          src={src}
          alt=""
          width={320}
          height={200}
          className={["h-auto w-full select-none object-contain", imageClassName].join(" ")}
          unoptimized
          draggable={false}
        />
      </span>
      <span className="max-w-[6.5rem] text-[9px] font-medium leading-tight tracking-wide text-[#4a3828]/92 sm:text-[10px]">
        {label}
      </span>
    </button>
  );
}

function PaperCard({ children }: { children: ReactNode }) {
  return (
    <div
      className="relative z-10 mx-auto w-full max-w-[22rem] overflow-hidden rounded-[1.65rem] border border-[#e4d5c0]/95 shadow-[0_22px_50px_rgba(70,52,32,0.28)]"
      style={{
        background:
          "linear-gradient(165deg, #fdfbf4 0%, #f7f0e4 48%, #f3eadc 100%)",
      }}
    >
      {/* 紙のざらつき */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.35] mix-blend-multiply"
        style={{
          backgroundImage:
            "radial-gradient(circle at 18% 22%, rgba(180,150,110,0.18) 0, transparent 42%), radial-gradient(circle at 82% 12%, rgba(140,160,120,0.12) 0, transparent 36%), radial-gradient(circle at 70% 78%, rgba(190,160,120,0.14) 0, transparent 40%)",
        }}
        aria-hidden
      />
      <div className="pointer-events-none absolute -bottom-1 -right-1 opacity-50" aria-hidden>
        <LeafMark className="h-16 w-16 text-emerald-800/35" />
      </div>
      <div className="relative px-4 pb-4 pt-4 sm:px-5 sm:pb-5">{children}</div>
    </div>
  );
}

/** ログハウス：森のラジカセ操作カード（UI先行モック・音なし） */
export function LogHouseRadioCassetteModal({ open, onClose, musicHallHref }: Props) {
  const [view, setView] = useState<PanelView>("player");
  const [cassetteId, setCassetteId] = useState(LOG_HOUSE_RADIO_DEFAULT_CASSETTE_ID);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [repeatMode, setRepeatMode] = useState<LogHouseRadioRepeatMode>("off");
  const [sleepTimer, setSleepTimer] = useState<LogHouseRadioSleepTimerMinutes>("off");

  useEffect(() => {
    if (!open) return;
    setView("player");
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      if (view === "picker") {
        setView("player");
        return;
      }
      onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose, view]);

  if (!open) return null;

  const cassette = findLogHouseRadioCassette(cassetteId);
  const resolvedMusicHallHref = musicHallHref ?? logHouseRadioMusicHallHref();
  const statusLabel = logHouseRadioPlaybackStatusLabel({ isPlaying, isPaused });

  return (
    <div className="fixed inset-0 z-[70] flex items-end justify-center px-3 pb-[max(1rem,env(safe-area-inset-bottom))] pt-8 sm:items-center sm:py-8">
      <button
        type="button"
        className="absolute inset-0 bg-[#2c2418]/40 backdrop-blur-[2px]"
        aria-label="ラジカセを閉じる"
        onClick={onClose}
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={view === "player" ? "loghouse-radio-title" : "loghouse-radio-picker-title"}
        className="relative z-10 w-full max-w-[22rem]"
      >
        <PaperCard>
          {view === "player" ? (
            <>
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-[11px] font-medium tracking-[0.08em] text-[#7a6248]">
                    {LOG_HOUSE_RADIO_EYEBROW}
                  </p>
                  <h2
                    id="loghouse-radio-title"
                    className="mt-0.5 font-serif text-[1.2rem] font-semibold tracking-wide text-[#3d3226]"
                  >
                    {LOG_HOUSE_RADIO_TITLE}
                  </h2>
                </div>
                <button
                  type="button"
                  onClick={onClose}
                  className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-[#e0d2bc] bg-[#f8f1e4]/90 text-[#6b5844] shadow-sm transition hover:bg-[#f3ead9]"
                  aria-label={LOG_HOUSE_RADIO_CLOSE_LABEL}
                >
                  ✕
                </button>
              </div>

              <p className="mt-3 flex gap-2 rounded-2xl border border-[#e8d7a8]/90 bg-[#fbf5df]/90 px-3 py-2.5 text-[11px] leading-relaxed text-[#6a5740]">
                <LeafMark className="mt-0.5 h-4 w-4 shrink-0 text-[#7d8a52]" />
                <span>{LOG_HOUSE_RADIO_PREPARING_NOTE}</span>
              </p>

              <section className="mt-3.5 flex gap-3 rounded-[1.15rem] border border-[#e6d7c2]/90 bg-[#fffaf2]/75 px-3.5 py-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.65)]">
                <div className="min-w-0 flex-1">
                  <p className="text-[10px] font-medium tracking-[0.08em] text-[#8a7762]">
                    {LOG_HOUSE_RADIO_NOW_LABEL}
                  </p>
                  <p className="mt-1 text-sm font-semibold leading-snug text-[#3d3226]">
                    {cassette.title}
                  </p>
                  <p className="mt-0.5 text-[11px] leading-relaxed text-[#6e5c48]">{cassette.blurb}</p>
                  <p
                    className={[
                      "mt-2 inline-flex rounded-full px-2.5 py-0.5 text-[10px] font-medium",
                      isPlaying
                        ? "bg-[#dfe8c8]/95 text-[#3f5130]"
                        : "bg-[#e7e0d4]/95 text-[#6a5d4e]",
                    ].join(" ")}
                  >
                    {statusLabel}
                  </p>
                </div>
                <CassetteJacketThumb cassette={cassette} />
              </section>

              {/* 木製操作パネル：画像全体（取っ手含む）を切らず、ボタンを内側に収める */}
              <section
                className="relative mt-4 w-full drop-shadow-[0_12px_24px_rgba(55,40,22,0.24)]"
                style={{
                  aspectRatio: `${LOG_HOUSE_RADIO_PANEL_WOOD_INTRINSIC.widthPx} / ${LOG_HOUSE_RADIO_PANEL_WOOD_INTRINSIC.heightPx}`,
                }}
                aria-label="ラジカセの操作パネル"
              >
                <Image
                  src={LOG_HOUSE_RADIO_PANEL_WOOD_SRC}
                  alt=""
                  fill
                  className="pointer-events-none object-contain object-center"
                  sizes="22rem"
                  unoptimized
                  priority
                />
                <div className="absolute inset-[18%_11%_11%_11%] flex flex-col justify-center">
                  <div className="grid grid-cols-2 gap-x-2 gap-y-0">
                    <PhysicalButton
                      src={LOG_HOUSE_RADIO_BUTTON_ASSETS.playPause}
                      label={LOG_HOUSE_RADIO_PLAY_PAUSE_LABEL}
                      pressed={isPlaying}
                      onClick={() => {
                        if (isPlaying) {
                          setIsPlaying(false);
                          setIsPaused(true);
                          return;
                        }
                        setIsPlaying(true);
                        setIsPaused(false);
                      }}
                    />
                    <PhysicalButton
                      src={LOG_HOUSE_RADIO_BUTTON_ASSETS.stop}
                      label={LOG_HOUSE_RADIO_STOP_LABEL}
                      pressed={!isPlaying && !isPaused}
                      onClick={() => {
                        setIsPlaying(false);
                        setIsPaused(false);
                      }}
                    />
                  </div>

                  <div className="mt-0.5 grid grid-cols-3 gap-1">
                    <PhysicalButton
                      src={LOG_HOUSE_RADIO_BUTTON_ASSETS.repeatOne}
                      label={LOG_HOUSE_RADIO_REPEAT_ONE_LABEL}
                      pressed={repeatMode === "one"}
                      onClick={() => setRepeatMode((m) => (m === "one" ? "off" : "one"))}
                    />
                    <PhysicalButton
                      src={LOG_HOUSE_RADIO_BUTTON_ASSETS.repeatAll}
                      label={LOG_HOUSE_RADIO_REPEAT_ALL_LABEL}
                      pressed={repeatMode === "all"}
                      onClick={() => setRepeatMode((m) => (m === "all" ? "off" : "all"))}
                    />
                    <PhysicalButton
                      src={LOG_HOUSE_RADIO_BUTTON_ASSETS.timer}
                      label={LOG_HOUSE_RADIO_TIMER_BUTTON_LABEL}
                      pressed={sleepTimer !== "off"}
                      onClick={() =>
                        setSleepTimer((current) => {
                          if (current === "off") return 15;
                          if (current === 15) return 30;
                          if (current === 30) return 60;
                          return "off";
                        })
                      }
                    />
                  </div>
                </div>
              </section>

              <button
                type="button"
                onClick={() => setView("picker")}
                className="mt-3.5 flex min-h-[48px] w-full items-center gap-3 rounded-2xl border border-[#e0d2bc]/95 bg-[#fffaf2]/90 px-3.5 py-2.5 text-left shadow-sm transition hover:bg-[#fff6ea] active:scale-[0.99]"
              >
                <Image
                  src={LOG_HOUSE_RADIO_CASSETTE_ICON_SRC}
                  alt=""
                  width={44}
                  height={30}
                  className="h-8 w-auto shrink-0 object-contain"
                  unoptimized
                />
                <span className="flex-1 text-sm font-semibold text-[#3d3226]">
                  {LOG_HOUSE_RADIO_SWAP_LABEL}
                </span>
                <span className="text-[#9a876f]" aria-hidden>
                  ›
                </span>
              </button>

              <section className="mt-4">
                <p className="flex items-center gap-1.5 text-[11px] font-medium tracking-[0.06em] text-[#6e5c48]">
                  <LeafMark className="h-3.5 w-3.5 text-[#7d8a52]" />
                  {LOG_HOUSE_RADIO_SLEEP_TIMER_LABEL}
                </p>
                <div className="mt-2 grid grid-cols-4 gap-1.5">
                  {LOG_HOUSE_RADIO_SLEEP_TIMER_OPTIONS.map((option) => {
                    const active = sleepTimer === option.value;
                    return (
                      <button
                        key={String(option.value)}
                        type="button"
                        aria-pressed={active}
                        onClick={() => setSleepTimer(option.value)}
                        className={[
                          "relative min-h-[40px] rounded-xl border px-1 text-[10px] font-medium leading-tight transition sm:text-[11px]",
                          active
                            ? "border-[#9aaa6d] bg-[#e8efd4]/95 text-[#3f5130] shadow-[0_0_0_1px_rgba(154,170,109,0.35)]"
                            : "border-[#e0d2bc]/90 bg-[#fffdf8]/80 text-[#6a5846] hover:bg-[#f7efe3]",
                        ].join(" ")}
                      >
                        {active ? (
                          <LeafMark className="pointer-events-none absolute -left-0.5 -top-1.5 h-3.5 w-3.5 text-[#7d8a52]" />
                        ) : null}
                        {option.label}
                      </button>
                    );
                  })}
                </div>
              </section>

              <p className="mt-4 text-center">
                <Link
                  href={resolvedMusicHallHref}
                  className="inline-flex items-center gap-1 text-sm font-medium text-[#3f5a32] underline-offset-2 hover:underline"
                >
                  <span aria-hidden>🌲</span>
                  {LOG_HOUSE_RADIO_MUSIC_HALL_LINK_LABEL} →
                </Link>
              </p>

              <button
                type="button"
                onClick={onClose}
                className="mt-3 flex min-h-[44px] w-full items-center justify-center rounded-full border border-[#e0d2bc]/95 bg-[#faf4e8]/95 text-sm font-medium text-[#5c4a35] shadow-sm transition hover:bg-[#f3ead9]"
              >
                {LOG_HOUSE_RADIO_CLOSE_LABEL}
              </button>
            </>
          ) : (
            <>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <button
                    type="button"
                    onClick={() => setView("player")}
                    className="text-xs font-medium text-[#7a6652] underline-offset-2 hover:text-[#3d3226] hover:underline"
                  >
                    ← ラジカセにもどる
                  </button>
                  <h2
                    id="loghouse-radio-picker-title"
                    className="mt-1 font-serif text-[1.1rem] font-semibold tracking-wide text-[#3d3226]"
                  >
                    {LOG_HOUSE_RADIO_PICKER_TITLE}
                  </h2>
                </div>
                <button
                  type="button"
                  onClick={onClose}
                  className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-[#e0d2bc] bg-[#f8f1e4]/90 text-[#6b5844] shadow-sm transition hover:bg-[#f3ead9]"
                  aria-label={LOG_HOUSE_RADIO_CLOSE_LABEL}
                >
                  ✕
                </button>
              </div>

              <p className="mt-3 text-xs leading-relaxed text-[#6e5c48]">
                いまは仮のカセット一覧です。あとで音源がそろったら、ここから入れ替えできるようになります。
              </p>

              <ul className="mt-3 max-h-[min(52dvh,22rem)] space-y-2.5 overflow-y-auto overscroll-contain pr-0.5">
                {LOG_HOUSE_RADIO_CASSETTES.map((item) => {
                  const selected = item.id === cassetteId;
                  return (
                    <li
                      key={item.id}
                      className={[
                        "rounded-2xl border px-3.5 py-3",
                        selected
                          ? "border-[#9aaa6d]/90 bg-[#eef3e0]/70"
                          : "border-[#e6d7c2]/90 bg-[#fffaf2]/85",
                      ].join(" ")}
                    >
                      <div className="flex items-start gap-3">
                        <CassetteJacketThumb cassette={item} sizeClass="h-14 w-14" />
                        <div className="min-w-0 flex-1">
                          <div className="flex items-start justify-between gap-2">
                            <p className="text-sm font-semibold text-[#3d3226]">{item.title}</p>
                            {selected ? (
                              <span className="shrink-0 rounded-full bg-[#dfe8c8] px-2 py-0.5 text-[10px] font-medium text-[#3f5130]">
                                {LOG_HOUSE_RADIO_CURRENT_BADGE}
                              </span>
                            ) : null}
                          </div>
                          <p className="mt-0.5 text-xs text-[#6e5c48]">{item.blurb}</p>
                        </div>
                      </div>
                      <button
                        type="button"
                        disabled={selected}
                        onClick={() => {
                          setCassetteId(item.id);
                          setIsPlaying(false);
                          setIsPaused(false);
                          setView("player");
                        }}
                        className={[
                          "mt-2.5 flex min-h-[40px] w-full items-center justify-center rounded-xl border text-xs font-semibold transition",
                          selected
                            ? "border-[#c5d3a0]/80 bg-[#eef3e0]/50 text-[#5a6b45]/80"
                            : "border-[#d2bfa0]/95 bg-[#f3e6d2]/90 text-[#3d3226] hover:bg-[#efe0c8]",
                        ].join(" ")}
                      >
                        {selected ? LOG_HOUSE_RADIO_CURRENT_BADGE : LOG_HOUSE_RADIO_INSERT_LABEL}
                      </button>
                    </li>
                  );
                })}
              </ul>

              <p className="mt-4 text-center">
                <Link
                  href={resolvedMusicHallHref}
                  className="inline-flex items-center gap-1 text-sm font-medium text-[#3f5a32] underline-offset-2 hover:underline"
                >
                  <span aria-hidden>🌲</span>
                  {LOG_HOUSE_RADIO_MUSIC_HALL_LINK_LABEL} →
                </Link>
              </p>
            </>
          )}
        </PaperCard>
      </div>
    </div>
  );
}
