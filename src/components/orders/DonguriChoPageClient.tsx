"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";

import { MyPageSubpageHeader } from "@/components/orders/MyPageSubpageHeader";
import {
  DEVICE_MOVIE_DONGURI_DRAFT_CTA,
  DEVICE_MOVIE_DONGURI_DRAFT_TITLE,
} from "@/lib/journal/moriLog/deviceMovieComposerCopy";
import {
  deviceMovieDraftResumePath,
  getDeviceMovieDraftMeta,
  type DeviceMovieDraftMeta,
} from "@/lib/journal/moriLog/deviceMovieDraft";
import { DONGURI_ICON_SRC } from "@/lib/loghouse/donguriAssets";
import {
  DONGURI_BALANCE_LABEL,
  DONGURI_CHO_TITLE,
  DONGURI_EMPTY_LEDGER,
  DONGURI_RECEIVE_WAYS,
  DONGURI_RECEIVE_WAYS_TITLE,
  DONGURI_RECENT_LEDGER_LABEL,
  DONGURI_TODAY_DELIVERY_LABEL,
} from "@/lib/loghouse/donguriCopy";
import { fetchDonguriStatus } from "@/lib/loghouse/fetchDonguriStatus";
import { clearDonguriBalanceHint } from "@/lib/loghouse/donguriBalanceHint";
import { formatDonguriDelta, type DonguriChoView } from "@/lib/loghouse/donguriTypes";
import { LJD_PAGE_BG_CLASS, LJD_PAPER_CARD_CLASS } from "@/lib/ljd/ljdPaperSurface";
import { LOG_HOUSE_RETURN_TO_LABEL } from "@/lib/journal/logHouseLabels";

type Props = {
  view: DonguriChoView;
  unit: string;
  profileId: string;
};

/** ユーザー向けどんぐり帳（半没入） */
export function DonguriChoPageClient({ view: initialView, unit, profileId }: Props) {
  const [view, setView] = useState(initialView);
  const [draftMeta, setDraftMeta] = useState<DeviceMovieDraftMeta | null>(null);

  useEffect(() => {
    setView(initialView);
  }, [initialView]);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const meta = await getDeviceMovieDraftMeta(profileId);
      if (!cancelled) setDraftMeta(meta);
    })();
    return () => {
      cancelled = true;
    };
  }, [profileId]);

  useEffect(() => {
    let cancelled = false;
    const refresh = async () => {
      const status = await fetchDonguriStatus({ includeCho: true });
      if (cancelled || !status?.cho) return;
      setView(status.cho);
      if (status.profileId) clearDonguriBalanceHint(status.profileId);
    };
    void refresh();
    const onVisible = () => {
      if (document.visibilityState === "visible") void refresh();
    };
    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener("focus", onVisible);
    return () => {
      cancelled = true;
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("focus", onVisible);
    };
  }, []);

  return (
    <div className={`min-h-[100dvh] ${LJD_PAGE_BG_CLASS}`}>
      <div className="mx-auto w-full max-w-md space-y-5 px-4 pb-12 pt-5 sm:space-y-6">
        <MyPageSubpageHeader
          title={DONGURI_CHO_TITLE}
          backHref="/orders"
          backLabel={LOG_HOUSE_RETURN_TO_LABEL}
        />

        {draftMeta ? (
          <section
            className={`px-4 py-4 ${LJD_PAPER_CARD_CLASS}`}
            aria-label={DEVICE_MOVIE_DONGURI_DRAFT_TITLE}
          >
            <p className="text-sm font-semibold text-[#3d3226]">
              {DEVICE_MOVIE_DONGURI_DRAFT_TITLE}
            </p>
            <p className="mt-1 truncate text-xs text-[#6e5c48]">{draftMeta.title}</p>
            <Link
              href={deviceMovieDraftResumePath(draftMeta.id)}
              className="mt-3 flex min-h-11 items-center justify-center rounded-xl bg-[#3f5f4c] px-3 text-sm font-semibold text-white"
            >
              {DEVICE_MOVIE_DONGURI_DRAFT_CTA}
            </Link>
          </section>
        ) : null}

        <section className={`px-5 py-5 text-center ${LJD_PAPER_CARD_CLASS}`}>
          <div className="flex items-center justify-center gap-2">
            <Image
              src={DONGURI_ICON_SRC}
              alt=""
              width={32}
              height={32}
              className="h-8 w-8 object-contain"
              unoptimized
            />
            <p className="text-sm font-medium tracking-wide text-[#7a6652]">
              {DONGURI_BALANCE_LABEL}
            </p>
          </div>
          <p className="mt-2 text-4xl font-semibold tabular-nums text-[#3d3226]">
            {view.balance}
            <span className="ml-1 text-base font-medium text-[#6e5c48]">{unit}</span>
          </p>
          {view.todayDelivery ? (
            <p className="mt-3 text-sm text-[#5c4a3a]">
              {DONGURI_TODAY_DELIVERY_LABEL}
              <span className="ml-2 font-semibold text-emerald-800">
                {view.todayDelivery.label} {formatDonguriDelta(view.todayDelivery.delta)}
              </span>
            </p>
          ) : null}
        </section>

        <section className={`overflow-hidden ${LJD_PAPER_CARD_CLASS}`}>
          <h2 className="border-b border-[#ebe2d4] px-4 py-3 text-sm font-semibold text-[#3d3226]">
            {DONGURI_RECEIVE_WAYS_TITLE}
          </h2>
          <ul className="divide-y divide-[#ebe2d4]">
            {DONGURI_RECEIVE_WAYS.map((way) => (
              <li key={way.title} className="px-4 py-3.5">
                <p className="text-sm font-medium text-[#3d3226]">{way.title}</p>
                <p className="mt-1 whitespace-pre-wrap text-xs leading-relaxed text-[#6e5c48]">
                  {way.body}
                </p>
              </li>
            ))}
          </ul>
        </section>

        <section className={`overflow-hidden ${LJD_PAPER_CARD_CLASS}`}>
          <h2 className="border-b border-[#ebe2d4] px-4 py-3 text-sm font-semibold text-[#3d3226]">
            {DONGURI_RECENT_LEDGER_LABEL}
          </h2>
          {view.recent.length === 0 ? (
            <p className="px-4 py-6 text-center text-sm text-[#6e5c48]">{DONGURI_EMPTY_LEDGER}</p>
          ) : (
            <ul className="divide-y divide-[#ebe2d4]">
              {view.recent.map((row) => (
                <li key={row.id} className="flex items-center justify-between gap-3 px-4 py-3.5">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-[#3d3226]">{row.label}</p>
                    {row.description ? (
                      <p className="mt-0.5 truncate text-xs text-[#8a735c]">{row.description}</p>
                    ) : null}
                  </div>
                  <p
                    className={[
                      "shrink-0 text-sm font-semibold tabular-nums",
                      row.delta >= 0 ? "text-emerald-800" : "text-stone-600",
                    ].join(" ")}
                  >
                    {formatDonguriDelta(row.delta)}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </section>

        <p>
          <Link href="/orders/mailbox" className="text-sm text-[#5c4a3a] underline-offset-2 hover:underline">
            ポストを見る
          </Link>
        </p>
      </div>
    </div>
  );
}
