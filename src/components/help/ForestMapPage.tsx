"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState, useTransition, type CSSProperties } from "react";

import { OwlDelayedBusyOverlay } from "@/components/ui/OwlDelayedBusyOverlay";
import {
  FOREST_MAP_DESTINATIONS,
  type ForestMapSpotId,
} from "@/lib/help/forestMapDestinations";
import {
  FOREST_MAP_INTRINSIC,
  FOREST_MAP_PAGE_TITLE,
  FOREST_MAP_SRC,
} from "@/lib/help/forestMapAssets";
import { FOREST_MAP_HOTSPOTS } from "@/lib/help/forestMapHotspots";
import type {
  ForestGuideMapCoreNumber,
  ForestGuideMapKanteiHallLink,
} from "@/lib/help/forestGuideMapKanteiHallLink";
import { LOG_HOUSE_NAV_LABEL } from "@/lib/journal/logHouseLabels";
import { FIRST_VISIT_ROUTES } from "@/lib/onboarding/firstVisitWizard/routes";

type BackLink = { href: string; label: string };

type Props = {
  backLink: BackLink;
  /** 定規プレビュー用：枠を常時表示 */
  showHotspotOutlines?: boolean;
  /** immersive = 本番全画面 / framed = 定規用 */
  layout?: "immersive" | "framed";
};

const chromeButtonClass =
  "inline-flex h-11 w-11 items-center justify-center rounded-full border border-stone-500/20 bg-[#fffdf9]/55 text-stone-700 shadow-sm backdrop-blur-[3px] transition hover:bg-[#fffdf9]/75 active:scale-[0.98]";

function HomeIcon() {
  return (
    <svg aria-hidden className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M4.5 10.5 12 4.5l7.5 6V20a1.5 1.5 0 0 1-1.5 1.5h-3.75v-6h-4.5v6H6A1.5 1.5 0 0 1 4.5 20v-9.5Z"
      />
    </svg>
  );
}

function BackIcon() {
  return (
    <svg aria-hidden className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 6 9 12l6 6" />
    </svg>
  );
}

/** 576×1024 を viewport に収める（端が切れない contain） */
function containStageStyle(size: { widthPx: number; heightPx: number }): CSSProperties {
  const ratio = size.widthPx / size.heightPx;
  return {
    position: "absolute",
    left: "50%",
    top: "50%",
    width: `min(100vw, calc(100dvh * ${ratio}))`,
    height: `min(100dvh, calc(100vw / ${ratio}))`,
    transform: "translate(-50%, -50%)",
  };
}

function useKanteiHallLink(): {
  link: ForestGuideMapKanteiHallLink | null;
  loading: boolean;
} {
  const [link, setLink] = useState<ForestGuideMapKanteiHallLink | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    void fetch("/api/viewer/forest-guide-map-kantei-hall", { credentials: "same-origin" })
      .then(async (res) => {
        if (!res.ok) throw new Error("kantei hall link fetch failed");
        return (await res.json()) as ForestGuideMapKanteiHallLink;
      })
      .then((data) => {
        if (!cancelled) setLink(data);
      })
      .catch(() => {
        if (!cancelled) {
          setLink({
            branch: "guestOrNoResident",
            href: FIRST_VISIT_ROUTES.pathGuide,
            linkLabel: "はじめての方の案内へ",
          });
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return { link, loading };
}

function KanteiCoreNumbersPanel({
  coreNumbers,
  bookshelfHref,
  bookshelfLabel,
  onClose,
}: {
  coreNumbers: ForestGuideMapCoreNumber[];
  bookshelfHref: string;
  bookshelfLabel: string;
  onClose: () => void;
}) {
  return (
    <div className="absolute inset-x-0 bottom-0 z-[56] px-3 pb-[max(1rem,env(safe-area-inset-bottom))]">
      <div
        role="dialog"
        aria-labelledby="forest-map-kantei-panel-title"
        className="mx-auto max-w-md rounded-2xl border border-amber-100/90 bg-[#fffdf9]/96 px-4 py-4 shadow-lg backdrop-blur-[2px]"
      >
        <div className="mb-3 flex items-start justify-between gap-3">
          <h2 id="forest-map-kantei-panel-title" className="text-sm font-semibold text-stone-900">
            あなたのコアナンバー
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex min-h-[40px] min-w-[40px] items-center justify-center rounded-full border border-stone-200 text-stone-600 hover:bg-stone-50"
            aria-label="閉じる"
          >
            ✕
          </button>
        </div>
        <div className="grid grid-cols-3 gap-2">
          {coreNumbers.map((item) => (
            <div
              key={item.label}
              className="rounded-xl border border-amber-100 bg-gradient-to-br from-white to-amber-50/80 px-2 py-2.5 text-center"
            >
              <p className="text-[10px] font-medium leading-tight text-stone-500">{item.label}</p>
              <p className="mt-1 text-lg font-semibold tabular-nums text-stone-900">
                {item.value == null ? "—" : item.value}
              </p>
            </div>
          ))}
        </div>
        <Link
          href={bookshelfHref}
          className="mt-4 inline-flex min-h-[44px] w-full items-center justify-center rounded-xl border border-emerald-300 bg-emerald-50/90 px-4 text-sm font-semibold text-emerald-950 transition hover:bg-emerald-100"
        >
          {bookshelfLabel}
        </Link>
      </div>
    </div>
  );
}

function MapStage({
  busy,
  showHotspotOutlines,
  onActivate,
}: {
  busy: boolean;
  showHotspotOutlines: boolean;
  onActivate: (spotId: ForestMapSpotId) => void;
}) {
  return (
    <>
      <Image
        src={FOREST_MAP_SRC}
        alt=""
        fill
        priority
        sizes="100vw"
        className="object-contain object-center"
        unoptimized
        draggable={false}
      />
      <div className="absolute inset-0">
        {FOREST_MAP_HOTSPOTS.map((spot) => {
          const dest = FOREST_MAP_DESTINATIONS[spot.id];
          const ariaLabel = dest.comingSoonMessage
            ? `${dest.label}（準備中）`
            : `${dest.label}へ移動`;
          return (
            <button
              key={spot.id}
              type="button"
              disabled={busy}
              aria-label={ariaLabel}
              onClick={() => onActivate(spot.id)}
              className={[
                "absolute rounded-lg transition active:scale-[0.98]",
                "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-700",
                showHotspotOutlines
                  ? "border-2 border-emerald-500/70 bg-emerald-200/20"
                  : "border-2 border-transparent bg-transparent hover:border-emerald-400/40 hover:bg-emerald-100/10",
              ].join(" ")}
              style={{
                left: `${spot.x}%`,
                top: `${spot.y}%`,
                width: `${spot.width}%`,
                height: `${spot.height}%`,
              }}
            />
          );
        })}
      </div>
    </>
  );
}

function ForestMapChrome({ backLink }: { backLink: BackLink }) {
  return (
    <div className="pointer-events-none absolute inset-x-0 top-0 z-40 flex items-start justify-between gap-2 px-3 pb-2 pt-[max(0.75rem,env(safe-area-inset-top))]">
      <div className="pointer-events-auto">
        <Link
          href={backLink.href}
          className={chromeButtonClass}
          aria-label={backLink.label}
          title={backLink.label}
        >
          <BackIcon />
        </Link>
      </div>
      <div className="pointer-events-auto">
        <Link
          href="/orders"
          className={chromeButtonClass}
          aria-label={`${LOG_HOUSE_NAV_LABEL}へ`}
          title={`${LOG_HOUSE_NAV_LABEL}へ`}
        >
          <HomeIcon />
        </Link>
      </div>
    </div>
  );
}

/** BambooNOOKの森 案内図（タップで直接移動・全画面） */
export function ForestMapPage({
  backLink,
  showHotspotOutlines = false,
  layout = "immersive",
}: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [localBusy, setLocalBusy] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [showKanteiPanel, setShowKanteiPanel] = useState(false);
  const busy = isPending || localBusy;
  const { link: kanteiLink, loading: kanteiLoading } = useKanteiHallLink();

  useEffect(() => {
    if (!notice) return;
    const timer = window.setTimeout(() => setNotice(null), 3600);
    return () => window.clearTimeout(timer);
  }, [notice]);

  useEffect(() => {
    FOREST_MAP_HOTSPOTS.forEach((spot) => {
      const dest = FOREST_MAP_DESTINATIONS[spot.id];
      if (dest.href && !dest.external) router.prefetch(dest.href);
    });
    router.prefetch("/orders");
    if (backLink.href) router.prefetch(backLink.href);
    if (kanteiLink?.href) router.prefetch(kanteiLink.href);
  }, [backLink.href, kanteiLink?.href, router]);

  const navigate = useCallback(
    async (spotId: ForestMapSpotId) => {
      if (busy) return;
      const dest = FOREST_MAP_DESTINATIONS[spotId];

      if (dest.comingSoonMessage) {
        setNotice(dest.comingSoonMessage);
        return;
      }

      if (dest.resolve === "kanteiHall") {
        if (kanteiLoading || !kanteiLink) {
          setLocalBusy(true);
          return;
        }
        if (kanteiLink.branch === "hasKantei") {
          setShowKanteiPanel(true);
          return;
        }
        startTransition(() => {
          router.push(kanteiLink.href);
        });
        return;
      }

      if (!dest.href) return;

      if (dest.external) {
        window.open(dest.href, "_blank", "noopener,noreferrer");
        return;
      }

      startTransition(() => {
        router.push(dest.href!);
      });
    },
    [busy, kanteiLink, kanteiLoading, router, startTransition],
  );

  useEffect(() => {
    if (!localBusy) return;
    if (kanteiLoading) return;
    if (!kanteiLink) {
      setLocalBusy(false);
      return;
    }
    setLocalBusy(false);
    if (kanteiLink.branch === "hasKantei") {
      setShowKanteiPanel(true);
      return;
    }
    startTransition(() => {
      router.push(kanteiLink.href);
    });
  }, [kanteiLink, kanteiLoading, localBusy, router, startTransition]);

  const noticeOverlay = notice ? (
    <div className="pointer-events-none absolute inset-x-0 bottom-8 z-[55] flex justify-center px-4">
      <p
        role="status"
        className="max-w-sm rounded-xl border border-emerald-200/90 bg-[#fffdf9]/95 px-3.5 py-2.5 text-center text-xs leading-relaxed text-stone-700 shadow-lg backdrop-blur-[1px]"
      >
        {notice}
      </p>
    </div>
  ) : null;

  const kanteiPanel =
    showKanteiPanel && kanteiLink?.branch === "hasKantei" ? (
      <>
        <button
          type="button"
          className="absolute inset-0 z-[55] bg-stone-900/20"
          aria-label="パネルを閉じる"
          onClick={() => setShowKanteiPanel(false)}
        />
        <KanteiCoreNumbersPanel
          coreNumbers={
            kanteiLink.coreNumbers ?? [
              { label: "ライフパス", value: null },
              { label: "ディスティニー", value: null },
              { label: "ソウル", value: null },
              { label: "パーソナリティ", value: null },
              { label: "バースデー", value: null },
              { label: "マチュリティ", value: null },
            ]
          }
          bookshelfHref={kanteiLink.href}
          bookshelfLabel={kanteiLink.linkLabel}
          onClose={() => setShowKanteiPanel(false)}
        />
      </>
    ) : null;

  const busyOverlay = <OwlDelayedBusyOverlay busy={busy} spinnerDelayMs={0} className="bg-white/15" />;

  if (layout === "framed") {
    return (
      <div
        className="relative mx-auto w-full max-w-md overflow-hidden rounded-2xl border border-stone-200/90 bg-[#ebe4d4] shadow-sm"
        style={{
          aspectRatio: `${FOREST_MAP_INTRINSIC.widthPx} / ${FOREST_MAP_INTRINSIC.heightPx}`,
        }}
      >
        <div className="absolute inset-0 isolate overflow-hidden">
          <MapStage busy={busy} showHotspotOutlines={showHotspotOutlines} onActivate={navigate} />
        </div>
        <ForestMapChrome backLink={backLink} />
        {noticeOverlay}
        {kanteiPanel}
        {busyOverlay}
        <p className="sr-only">{FOREST_MAP_PAGE_TITLE}</p>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[60] overflow-hidden overscroll-none bg-[#ebe4d4] select-none">
      <div className="absolute inset-0 overflow-hidden">
        <div className="relative isolate overflow-hidden" style={containStageStyle(FOREST_MAP_INTRINSIC)}>
          <MapStage busy={busy} showHotspotOutlines={showHotspotOutlines} onActivate={navigate} />
        </div>
      </div>
      <ForestMapChrome backLink={backLink} />
      {noticeOverlay}
      {kanteiPanel}
      {busyOverlay}
      <h1 className="sr-only">{FOREST_MAP_PAGE_TITLE}</h1>
    </div>
  );
}
