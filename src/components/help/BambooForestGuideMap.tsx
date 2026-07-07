"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";

import {
  FOREST_GUIDE_MAP_BUILDINGS,
  type ForestGuideMapBuildingId,
  type ForestGuideMapBuildingInfo,
} from "@/lib/help/bambooForestGuideMapBuildings";
import type { ForestGuideMapKanteiHallLink } from "@/lib/help/forestGuideMapKanteiHallLink";
import { forestGuideMapHotspots } from "@/lib/help/bambooForestGuideMapHotspots";
import {
  BAMBOO_FOREST_GUIDE_MAP_INTRINSIC,
  bambooForestGuideMapSrc,
} from "@/lib/help/bambooForestGuideMap";
import type { FirstVisitWelcomeViewport } from "@/lib/onboarding/firstVisitWizard/welcomeAssets";

type Props = {
  className?: string;
  /** 案内図の説明（スクリーンリーダー向け） */
  alt?: string;
};

function useGuideMapViewport(): FirstVisitWelcomeViewport | null {
  const [viewport, setViewport] = useState<FirstVisitWelcomeViewport | null>(null);

  useEffect(() => {
    const mq = window.matchMedia("(min-width: 1024px)");
    const update = () => setViewport(mq.matches ? "desktop" : "mobile");
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  return viewport;
}

function ForestGuideMapBuildingPanel({
  building,
  onClose,
}: {
  building: ForestGuideMapBuildingInfo;
  onClose: () => void;
}) {
  const buildingId = building.id;

  return (
    <div
      className="rounded-xl border border-emerald-100 bg-[#fffdf9] px-4 py-3.5 shadow-sm"
      role="region"
      aria-labelledby={`forest-guide-map-building-${buildingId}`}
    >
      <div className="flex items-start justify-between gap-3">
        <h3
          id={`forest-guide-map-building-${buildingId}`}
          className="text-sm font-semibold text-stone-900 sm:text-base"
        >
          {building.title}
        </h3>
        <button
          type="button"
          onClick={onClose}
          className="shrink-0 rounded-lg px-2 py-1 text-xs text-stone-500 hover:bg-stone-100 hover:text-stone-800"
          aria-label="説明を閉じる"
        >
          閉じる
        </button>
      </div>
      <p className="mt-2 text-sm leading-relaxed text-stone-600">{building.body}</p>
      {building.href && building.linkLabel ? (
        <p className="mt-3">
          {building.external ? (
            <a
              href={building.href}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-h-[44px] items-center text-sm font-medium text-emerald-900 underline-offset-2 hover:underline"
            >
              {building.linkLabel} ↗
            </a>
          ) : (
            <Link
              href={building.href}
              className="inline-flex min-h-[44px] items-center text-sm font-medium text-emerald-900 underline-offset-2 hover:underline"
            >
              {building.linkLabel} →
            </Link>
          )}
        </p>
      ) : null}
    </div>
  );
}

function useKanteiHallMapLink(): ForestGuideMapKanteiHallLink | null {
  const [link, setLink] = useState<ForestGuideMapKanteiHallLink | null>(null);

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
            href: "/guide/first/welcome",
            linkLabel: "はじめての方の案内へ",
          });
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return link;
}

function resolveBuildingForPanel(
  buildingId: ForestGuideMapBuildingId,
  kanteiHallLink: ForestGuideMapKanteiHallLink | null,
): ForestGuideMapBuildingInfo {
  const building = FOREST_GUIDE_MAP_BUILDINGS[buildingId];
  if (buildingId !== "kanteiHall" || !kanteiHallLink) {
    return building;
  }
  return {
    ...building,
    href: kanteiHallLink.href,
    linkLabel: kanteiHallLink.linkLabel,
  };
}

/** BambooNOOKの森の案内図（建物タップで説明＋行き先） */
export function BambooForestGuideMap({
  className = "",
  alt = "BambooNOOKの森の案内図",
}: Props) {
  const viewport = useGuideMapViewport();
  const kanteiHallLink = useKanteiHallMapLink();
  const [selectedId, setSelectedId] = useState<ForestGuideMapBuildingId | null>(null);

  useEffect(() => {
    setSelectedId(null);
  }, [viewport]);

  if (!viewport) {
    return (
      <div
        className={[
          "aspect-[9/16] w-full max-w-md animate-pulse rounded-xl bg-stone-200/80 lg:aspect-video lg:max-w-2xl",
          className,
        ].join(" ")}
        aria-hidden
      />
    );
  }

  const intrinsic = BAMBOO_FOREST_GUIDE_MAP_INTRINSIC[viewport];
  const isDesktop = viewport === "desktop";
  const hotspots = forestGuideMapHotspots(viewport);
  const aspectRatio = `${intrinsic.widthPx} / ${intrinsic.heightPx}`;

  return (
    <figure className={className}>
      <div
        className={[
          "relative mx-auto w-full overflow-hidden rounded-xl border border-stone-200/90 bg-[#ebe4d4] shadow-sm",
          isDesktop ? "max-w-2xl" : "max-w-md",
        ].join(" ")}
        style={{ aspectRatio }}
      >
        <Image
          src={bambooForestGuideMapSrc(viewport)}
          alt=""
          fill
          sizes={isDesktop ? "(min-width: 1024px) 42rem, 100vw" : "(max-width: 1023px) 100vw, 28rem"}
          className="object-contain"
          quality={100}
          unoptimized
        />

        <div className="absolute inset-0" aria-hidden={false}>
          {hotspots.map((spot) => {
            const building = FOREST_GUIDE_MAP_BUILDINGS[spot.id];
            const isSelected = selectedId === spot.id;
            return (
              <button
                key={spot.id}
                type="button"
                aria-label={`${building.title}の説明を見る`}
                aria-pressed={isSelected}
                onClick={() => setSelectedId((current) => (current === spot.id ? null : spot.id))}
                className={[
                  "absolute rounded-lg border-2 transition",
                  "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-700",
                  isSelected
                    ? "border-emerald-500/80 bg-emerald-200/25"
                    : "border-transparent bg-white/0 hover:border-emerald-400/50 hover:bg-emerald-100/15",
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

      <figcaption className="sr-only">{alt}</figcaption>

      {selectedId ? (
        <div className="mt-3">
          <ForestGuideMapBuildingPanel
            building={resolveBuildingForPanel(selectedId, kanteiHallLink)}
            onClose={() => setSelectedId(null)}
          />
        </div>
      ) : (
        <p className="mt-2 text-xs text-stone-500">建物をタップして説明を表示できます。</p>
      )}
    </figure>
  );
}
