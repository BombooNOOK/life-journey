"use client";

import Image from "next/image";
import { useLayoutEffect, useRef, useState } from "react";

import { HomeForestSignLoginNote, HomeForestSignOverlay } from "@/components/home/HomeForestSignOverlay";
import {
  computeObjectCoverLayout,
  HOME_FOREST_SIGN_OBJECT_POSITION,
  objectPositionCss,
  type HomeForestSignViewport,
  type ObjectCoverLayout,
} from "@/lib/home/homeForestSignLayout";
import {
  HOME_FOREST_SIGN_DESKTOP_BG_SRC,
  HOME_FOREST_SIGN_MOBILE_BG_SRC,
} from "@/lib/home/homeForestSignAssets";

type NavItem = {
  id: string;
  href: string;
  label: string;
};

type Props = {
  viewport: HomeForestSignViewport;
  navById: Record<string, NavItem>;
  primaryNavId: string;
  isLoggedIn: boolean;
  className?: string;
};

const BG_SRC: Record<HomeForestSignViewport, string> = {
  mobile: HOME_FOREST_SIGN_MOBILE_BG_SRC,
  desktop: HOME_FOREST_SIGN_DESKTOP_BG_SRC,
};

function initialCoverLayout(viewport: HomeForestSignViewport): ObjectCoverLayout | null {
  if (typeof window === "undefined") return null;
  return computeObjectCoverLayout(
    window.innerWidth,
    window.innerHeight,
    viewport,
    HOME_FOREST_SIGN_OBJECT_POSITION[viewport],
  );
}

/** 画面いっぱいの object-cover 背景＋看板テキスト */
export function HomeForestSignStage({
  viewport,
  navById,
  primaryNavId,
  isLoggedIn,
  className = "",
}: Props) {
  const stageRef = useRef<HTMLDivElement>(null);
  const objectPosition = HOME_FOREST_SIGN_OBJECT_POSITION[viewport];
  const [coverLayout, setCoverLayout] = useState<ObjectCoverLayout | null>(() =>
    initialCoverLayout(viewport),
  );

  useLayoutEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;

    const update = () => {
      const rect = stage.getBoundingClientRect();
      if (rect.width <= 0 || rect.height <= 0) return;
      setCoverLayout(
        computeObjectCoverLayout(rect.width, rect.height, viewport, objectPosition),
      );
    };

    update();
    const observer = new ResizeObserver(update);
    observer.observe(stage);
    return () => observer.disconnect();
  }, [viewport, objectPosition]);

  return (
    <div
      ref={stageRef}
      className={className}
      style={{ position: "absolute", inset: 0 }}
    >
      <Image
        src={BG_SRC[viewport]}
        alt=""
        fill
        sizes={viewport === "mobile" ? "100vw" : "(min-width: 1024px) 100vw"}
        className="object-cover"
        style={{ objectPosition: objectPositionCss(objectPosition) }}
        priority
      />
      <HomeForestSignOverlay
        viewport={viewport}
        navById={navById}
        primaryNavId={primaryNavId}
        isLoggedIn={isLoggedIn}
        coverLayout={coverLayout}
      />
      <HomeForestSignLoginNote
        viewport={viewport}
        isLoggedIn={isLoggedIn}
        coverLayout={coverLayout}
      />
    </div>
  );
}
