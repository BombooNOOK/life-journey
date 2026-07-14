"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import {
  findLogHouseRadioCassette,
  LOG_HOUSE_RADIO_CASSETTES,
  LOG_HOUSE_RADIO_CLOSE_LABEL,
  LOG_HOUSE_RADIO_CURRENT_BADGE,
  LOG_HOUSE_RADIO_DEFAULT_CASSETTE_ID,
  LOG_HOUSE_RADIO_INSERT_LABEL,
  LOG_HOUSE_RADIO_MUSIC_HALL_LINK_LABEL,
  LOG_HOUSE_RADIO_NOW_LABEL,
  LOG_HOUSE_RADIO_PICKER_TITLE,
  LOG_HOUSE_RADIO_PLAY_LABEL,
  LOG_HOUSE_RADIO_PLAYING_LABEL,
  LOG_HOUSE_RADIO_PREPARING_NOTE,
  LOG_HOUSE_RADIO_REPEAT_ALL_LABEL,
  LOG_HOUSE_RADIO_REPEAT_ONE_LABEL,
  LOG_HOUSE_RADIO_SLEEP_TIMER_LABEL,
  LOG_HOUSE_RADIO_SLEEP_TIMER_OPTIONS,
  LOG_HOUSE_RADIO_STOP_LABEL,
  LOG_HOUSE_RADIO_STOPPED_LABEL,
  LOG_HOUSE_RADIO_SWAP_LABEL,
  LOG_HOUSE_RADIO_TITLE,
  logHouseRadioMusicHallHref,
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

const panelClass =
  "mx-auto w-full max-w-sm rounded-2xl border border-[#e0d2bc]/90 bg-[#fffdf8] px-4 py-4 shadow-[0_18px_40px_rgba(70,55,35,0.22)]";

const softButtonClass =
  "inline-flex min-h-[44px] items-center justify-center rounded-xl border px-3 text-sm font-semibold transition active:scale-[0.98] disabled:opacity-55";

/** ログハウス：森のラジカセ操作カード（UI先行モック・音なし） */
export function LogHouseRadioCassetteModal({ open, onClose, musicHallHref }: Props) {
  const [view, setView] = useState<PanelView>("player");
  const [cassetteId, setCassetteId] = useState(LOG_HOUSE_RADIO_DEFAULT_CASSETTE_ID);
  const [isPlaying, setIsPlaying] = useState(false);
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

  return (
    <div className="fixed inset-0 z-[70] flex items-end justify-center px-3 pb-[max(1rem,env(safe-area-inset-bottom))] pt-10 sm:items-center sm:py-8">
      <button
        type="button"
        className="absolute inset-0 bg-stone-900/35 backdrop-blur-[2px]"
        aria-label="ラジカセを閉じる"
        onClick={onClose}
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={view === "player" ? "loghouse-radio-title" : "loghouse-radio-picker-title"}
        className={`relative z-10 ${panelClass}`}
      >
        {view === "player" ? (
          <>
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[11px] font-medium tracking-wide text-amber-900/70">ログハウスの道具</p>
                <h2 id="loghouse-radio-title" className="mt-0.5 text-base font-semibold text-stone-900">
                  {LOG_HOUSE_RADIO_TITLE}
                </h2>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="inline-flex min-h-[40px] min-w-[40px] shrink-0 items-center justify-center rounded-full border border-stone-200/90 bg-white/80 text-stone-600 hover:bg-stone-50"
                aria-label={LOG_HOUSE_RADIO_CLOSE_LABEL}
              >
                ✕
              </button>
            </div>

            <p className="mt-3 rounded-xl border border-amber-200/70 bg-amber-50/70 px-3 py-2.5 text-xs leading-relaxed text-amber-950/85">
              {LOG_HOUSE_RADIO_PREPARING_NOTE}
            </p>

            <section className="mt-4 rounded-2xl border border-[#e6d7c2]/80 bg-[#f7efe3]/70 px-3.5 py-3">
              <p className="text-[11px] font-medium tracking-wide text-stone-500">{LOG_HOUSE_RADIO_NOW_LABEL}</p>
              <p className="mt-1 text-sm font-semibold text-stone-900">{cassette.title}</p>
              <p className="mt-0.5 text-xs text-stone-600">{cassette.blurb}</p>
              <p
                className={[
                  "mt-2 inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-medium",
                  isPlaying
                    ? "bg-emerald-100/90 text-emerald-900"
                    : "bg-stone-200/70 text-stone-600",
                ].join(" ")}
              >
                {isPlaying ? LOG_HOUSE_RADIO_PLAYING_LABEL : LOG_HOUSE_RADIO_STOPPED_LABEL}
              </p>
            </section>

            <div className="mt-4 grid grid-cols-2 gap-2">
              <button
                type="button"
                aria-pressed={isPlaying}
                onClick={() => setIsPlaying(true)}
                className={[
                  softButtonClass,
                  isPlaying
                    ? "border-emerald-400/70 bg-emerald-100/90 text-emerald-950"
                    : "border-[#d9c7ad]/90 bg-[#fff9f0] text-stone-800 hover:bg-[#fff3e4]",
                ].join(" ")}
              >
                {LOG_HOUSE_RADIO_PLAY_LABEL}
              </button>
              <button
                type="button"
                aria-pressed={!isPlaying}
                onClick={() => setIsPlaying(false)}
                className={[
                  softButtonClass,
                  !isPlaying
                    ? "border-stone-400/50 bg-stone-100/90 text-stone-800"
                    : "border-[#d9c7ad]/90 bg-[#fff9f0] text-stone-800 hover:bg-[#fff3e4]",
                ].join(" ")}
              >
                {LOG_HOUSE_RADIO_STOP_LABEL}
              </button>
            </div>

            <button
              type="button"
              onClick={() => setView("picker")}
              className={`${softButtonClass} mt-2 w-full border-[#cbb896]/90 bg-[#f3e6d2]/85 text-stone-800 hover:bg-[#efe0c8]`}
            >
              {LOG_HOUSE_RADIO_SWAP_LABEL}
            </button>

            <div className="mt-4 grid grid-cols-2 gap-2">
              <button
                type="button"
                aria-pressed={repeatMode === "one"}
                onClick={() => setRepeatMode((m) => (m === "one" ? "off" : "one"))}
                className={[
                  softButtonClass,
                  "text-xs",
                  repeatMode === "one"
                    ? "border-emerald-400/70 bg-emerald-50 text-emerald-950"
                    : "border-stone-200 bg-white/80 text-stone-700 hover:bg-stone-50",
                ].join(" ")}
              >
                {LOG_HOUSE_RADIO_REPEAT_ONE_LABEL}
                <span className="ml-1 font-normal opacity-70">{repeatMode === "one" ? "ON" : "OFF"}</span>
              </button>
              <button
                type="button"
                aria-pressed={repeatMode === "all"}
                onClick={() => setRepeatMode((m) => (m === "all" ? "off" : "all"))}
                className={[
                  softButtonClass,
                  "text-xs",
                  repeatMode === "all"
                    ? "border-emerald-400/70 bg-emerald-50 text-emerald-950"
                    : "border-stone-200 bg-white/80 text-stone-700 hover:bg-stone-50",
                ].join(" ")}
              >
                {LOG_HOUSE_RADIO_REPEAT_ALL_LABEL}
                <span className="ml-1 font-normal opacity-70">{repeatMode === "all" ? "ON" : "OFF"}</span>
              </button>
            </div>

            <section className="mt-4">
              <p className="text-[11px] font-medium tracking-wide text-stone-500">
                {LOG_HOUSE_RADIO_SLEEP_TIMER_LABEL}
              </p>
              <div className="mt-2 grid grid-cols-2 gap-2">
                {LOG_HOUSE_RADIO_SLEEP_TIMER_OPTIONS.map((option) => {
                  const active = sleepTimer === option.value;
                  return (
                    <button
                      key={String(option.value)}
                      type="button"
                      aria-pressed={active}
                      onClick={() => setSleepTimer(option.value)}
                      className={[
                        softButtonClass,
                        "text-xs",
                        active
                          ? "border-amber-400/70 bg-amber-50 text-amber-950"
                          : "border-stone-200 bg-white/80 text-stone-700 hover:bg-stone-50",
                      ].join(" ")}
                    >
                      {option.label}
                    </button>
                  );
                })}
              </div>
            </section>

            <p className="mt-4 text-center">
              <Link
                href={resolvedMusicHallHref}
                className="text-sm font-medium text-emerald-900 underline-offset-2 hover:underline"
              >
                {LOG_HOUSE_RADIO_MUSIC_HALL_LINK_LABEL} →
              </Link>
            </p>

            <button
              type="button"
              onClick={onClose}
              className={`${softButtonClass} mt-3 w-full border-stone-200 bg-white/90 text-stone-700 hover:bg-stone-50`}
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
                  className="text-xs font-medium text-stone-500 underline-offset-2 hover:text-stone-800 hover:underline"
                >
                  ← ラジカセにもどる
                </button>
                <h2 id="loghouse-radio-picker-title" className="mt-1 text-base font-semibold text-stone-900">
                  {LOG_HOUSE_RADIO_PICKER_TITLE}
                </h2>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="inline-flex min-h-[40px] min-w-[40px] shrink-0 items-center justify-center rounded-full border border-stone-200/90 bg-white/80 text-stone-600 hover:bg-stone-50"
                aria-label={LOG_HOUSE_RADIO_CLOSE_LABEL}
              >
                ✕
              </button>
            </div>

            <p className="mt-3 text-xs leading-relaxed text-stone-600">
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
                        ? "border-emerald-300/80 bg-emerald-50/50"
                        : "border-[#e6d7c2]/80 bg-[#fffaf2]/80",
                    ].join(" ")}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-stone-900">{item.title}</p>
                        <p className="mt-0.5 text-xs text-stone-600">{item.blurb}</p>
                      </div>
                      {selected ? (
                        <span className="shrink-0 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-medium text-emerald-900">
                          {LOG_HOUSE_RADIO_CURRENT_BADGE}
                        </span>
                      ) : null}
                    </div>
                    <button
                      type="button"
                      disabled={selected}
                      onClick={() => {
                        setCassetteId(item.id);
                        setIsPlaying(false);
                        setView("player");
                      }}
                      className={[
                        softButtonClass,
                        "mt-2.5 w-full text-xs",
                        selected
                          ? "border-emerald-200/80 bg-emerald-50/40 text-emerald-900/70"
                          : "border-[#cbb896]/90 bg-[#f3e6d2]/85 text-stone-800 hover:bg-[#efe0c8]",
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
                className="text-sm font-medium text-emerald-900 underline-offset-2 hover:underline"
              >
                {LOG_HOUSE_RADIO_MUSIC_HALL_LINK_LABEL} →
              </Link>
            </p>
          </>
        )}
      </div>
    </div>
  );
}
