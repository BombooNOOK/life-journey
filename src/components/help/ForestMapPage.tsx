"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState, useTransition } from "react";

import { OwlDelayedBusyOverlay } from "@/components/ui/OwlDelayedBusyOverlay";
import {
  FOREST_MAP_DESTINATIONS,
  type ForestMapSpotId,
} from "@/lib/help/forestMapDestinations";
import {
  FOREST_MAP_INTRINSIC,
  FOREST_MAP_PAGE_DESCRIPTION,
  FOREST_MAP_PAGE_TITLE,
  FOREST_MAP_SRC,
} from "@/lib/help/forestMapAssets";
import { FOREST_MAP_HOTSPOTS } from "@/lib/help/forestMapHotspots";
import type { ForestGuideMapKanteiHallLink } from "@/lib/help/forestGuideMapKanteiHallLink";

type BackLink = { href: string; label: string };

type Props = {
  backLink: BackLink;
  /** 定規プレビュー用：枠を常時表示 */
  showHotspotOutlines?: boolean;
};

function useKanteiHallHref(): {
  href: string | null;
  loading: boolean;
} {
  const [href, setHref] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    void fetch("/api/viewer/forest-guide-map-kantei-hall", { credentials: "same-origin" })
      .then(async (res) => {
        if (!res.ok) throw new Error("kantei hall link fetch failed");
        return (await res.json()) as ForestGuideMapKanteiHallLink;
      })
      .then((data) => {
        if (!cancelled) setHref(data.href);
      })
      .catch(() => {
        if (!cancelled) setHref("/guide/first/path-guide");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return { href, loading };
}

/** BambooNOOKの森 案内図（タップで直接移動） */
export function ForestMapPage({ backLink, showHotspotOutlines = false }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [localBusy, setLocalBusy] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const busy = isPending || localBusy;
  const { href: kanteiHref, loading: kanteiLoading } = useKanteiHallHref();

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
  }, [router]);

  const navigate = useCallback(
    async (spotId: ForestMapSpotId) => {
      if (busy) return;
      const dest = FOREST_MAP_DESTINATIONS[spotId];

      if (dest.comingSoonMessage) {
        setNotice(dest.comingSoonMessage);
        return;
      }

      if (dest.resolve === "kanteiHall") {
        if (kanteiLoading || !kanteiHref) {
          setLocalBusy(true);
          return;
        }
        startTransition(() => {
          router.push(kanteiHref);
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
    [busy, kanteiHref, kanteiLoading, router, startTransition],
  );

  useEffect(() => {
    if (!localBusy) return;
    if (kanteiLoading) return;
    if (!kanteiHref) {
      setLocalBusy(false);
      return;
    }
    setLocalBusy(false);
    startTransition(() => {
      router.push(kanteiHref);
    });
  }, [kanteiHref, kanteiLoading, localBusy, router, startTransition]);

  return (
    <div className="mx-auto flex min-h-[100dvh] w-full max-w-lg flex-col px-3 pb-8 pt-4 sm:px-4">
      <OwlDelayedBusyOverlay busy={busy} spinnerDelayMs={0} />

      <div className="mb-3 flex items-center justify-between gap-3">
        <Link
          href={backLink.href}
          className="inline-flex min-h-[44px] items-center text-sm font-medium text-emerald-900 underline-offset-2 hover:underline"
        >
          ← {backLink.label}
        </Link>
      </div>

      <header className="mb-3 space-y-1">
        <h1 className="text-lg font-semibold text-stone-900 sm:text-xl">{FOREST_MAP_PAGE_TITLE}</h1>
        <p className="text-sm leading-relaxed text-stone-600">{FOREST_MAP_PAGE_DESCRIPTION}</p>
      </header>

      <div
        className="relative w-full overflow-hidden rounded-2xl border border-stone-200/90 bg-[#ebe4d4] shadow-sm"
        style={{
          aspectRatio: `${FOREST_MAP_INTRINSIC.widthPx} / ${FOREST_MAP_INTRINSIC.heightPx}`,
        }}
      >
        <Image
          src={FOREST_MAP_SRC}
          alt={FOREST_MAP_PAGE_TITLE}
          fill
          priority
          sizes="(max-width: 512px) 100vw, 32rem"
          className="object-contain"
          unoptimized
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
                onClick={() => void navigate(spot.id)}
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
      </div>

      {notice ? (
        <p
          role="status"
          className="mt-3 rounded-xl border border-emerald-200/90 bg-[#fffdf9] px-3.5 py-2.5 text-center text-sm leading-relaxed text-stone-700 shadow-sm"
        >
          {notice}
        </p>
      ) : null}
    </div>
  );
}
