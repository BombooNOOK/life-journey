"use client";

import Image from "next/image";
import { useEffect } from "react";

import { DONGURI_CHO_CARD_SRC, DONGURI_ICON_SRC } from "@/lib/loghouse/donguriAssets";
import {
  DONGURI_BALANCE_LABEL,
  DONGURI_CHO_TITLE,
  DONGURI_CLOSE_LABEL,
  DONGURI_EMPTY_LEDGER,
  DONGURI_RECENT_LEDGER_LABEL,
  DONGURI_TODAY_DELIVERY_LABEL,
  DONGURI_UNIT,
} from "@/lib/loghouse/donguriCopy";
import {
  formatDonguriDelta,
  type DonguriChoView,
} from "@/lib/loghouse/donguriLedger";

type Props = {
  open: boolean;
  view: DonguriChoView;
  onClose: () => void;
};

/** ログハウス上にふわっと開くどんぐり帳カード */
export function LogHouseDonguriChoModal({ open, view, onClose }: Props) {
  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center px-4">
      <button
        type="button"
        className="absolute inset-0 bg-stone-900/35 backdrop-blur-[2px]"
        aria-label="どんぐり帳を閉じる"
        onClick={onClose}
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="donguri-cho-title"
        className="relative z-10 w-full max-w-sm overflow-hidden rounded-[1.75rem] shadow-[0_18px_48px_rgba(80,62,44,0.22)]"
      >
        <div className="pointer-events-none absolute inset-0" aria-hidden>
          <Image
            src={DONGURI_CHO_CARD_SRC}
            alt=""
            fill
            className="object-cover object-center"
            sizes="24rem"
            unoptimized
            priority
          />
          <div className="absolute inset-0 bg-[#f6efe4]/55" />
        </div>

        <div className="relative px-5 pb-5 pt-6 sm:px-6">
          <div className="flex items-center justify-center gap-2">
            <Image
              src={DONGURI_ICON_SRC}
              alt=""
              width={28}
              height={28}
              className="h-7 w-7 object-contain"
              unoptimized
              aria-hidden
            />
            <h2 id="donguri-cho-title" className="text-lg font-semibold tracking-wide text-stone-800">
              {DONGURI_CHO_TITLE}
            </h2>
          </div>

          <section className="mt-5 rounded-2xl border border-[#d9c7ad]/70 bg-[#fffdf8]/72 px-4 py-3.5 text-center shadow-sm">
            <p className="text-xs font-medium tracking-wide text-stone-500">{DONGURI_BALANCE_LABEL}</p>
            <p className="mt-1 text-3xl font-semibold tabular-nums text-stone-900">
              {view.balance}
              <span className="ml-1 text-base font-medium text-stone-600">{DONGURI_UNIT}</span>
            </p>
          </section>

          {view.todayDelivery ? (
            <section className="mt-3 rounded-2xl border border-[#d9c7ad]/55 bg-[#fffdf8]/65 px-4 py-3">
              <p className="text-xs font-medium tracking-wide text-stone-500">
                {DONGURI_TODAY_DELIVERY_LABEL}
              </p>
              <p className="mt-1 text-sm text-stone-700">
                {view.todayDelivery.label}
                <span className="ml-2 font-semibold tabular-nums text-emerald-800">
                  {formatDonguriDelta(view.todayDelivery.delta)}
                </span>
              </p>
            </section>
          ) : null}

          <section className="mt-3 rounded-2xl border border-[#d9c7ad]/55 bg-[#fffdf8]/65 px-4 py-3">
            <p className="text-xs font-medium tracking-wide text-stone-500">
              {DONGURI_RECENT_LEDGER_LABEL}
            </p>
            {view.recent.length === 0 ? (
              <p className="mt-2 text-sm leading-relaxed text-stone-600">{DONGURI_EMPTY_LEDGER}</p>
            ) : (
              <ul className="mt-2 space-y-1.5">
                {view.recent.slice(0, 5).map((entry) => (
                  <li
                    key={entry.id}
                    className="flex items-start justify-between gap-3 text-sm leading-snug text-stone-700"
                  >
                    <span className="min-w-0">・{entry.label}</span>
                    <span
                      className={[
                        "shrink-0 font-semibold tabular-nums",
                        entry.delta > 0 ? "text-emerald-800" : "text-stone-600",
                      ].join(" ")}
                    >
                      {formatDonguriDelta(entry.delta)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <button
            type="button"
            onClick={onClose}
            className="mt-5 inline-flex min-h-[44px] w-full items-center justify-center rounded-xl border border-stone-400/35 bg-[#fffdf9]/85 text-sm font-medium text-stone-700 transition hover:bg-white"
          >
            {DONGURI_CLOSE_LABEL}
          </button>
        </div>
      </div>
    </div>
  );
}
