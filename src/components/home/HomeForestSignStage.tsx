"use client";

import Image from "next/image";
import { useLayoutEffect, useRef, useState } from "react";

import { HomeForestSignLoginNote, HomeForestSignOverlay } from "@/components/home/HomeForestSignOverlay";
import { useLogHouseRoomTimeTheme } from "@/hooks/useLogHouseRoomTimeOfDay";
import {
  computeObjectCoverLayout,
  HOME_FOREST_SIGN_OBJECT_POSITION,
  objectPositionCss,
  type HomeForestSignViewport,
  type ObjectCoverLayout,
} from "@/lib/home/homeForestSignLayout";
import { HOME_FOREST_SIGN_BG_BY_TIME } from "@/lib/home/homeForestSignAssets";
import type { LogHouseRoomTimeOfDay } from "@/lib/loghouse/logHouseRoomTimeTheme";

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
  /** プレビュー定規などで昼/夜を固定したいとき */
  timeOfDayOverride?: LogHouseRoomTimeOfDay;
};

function initialCoverLayout(viewport: HomeForestSignViewport): ObjectCoverLayout | null {
  if (typeof window === "undefined") return null;
  const w = window.visualViewport?.width ?? window.innerWidth;
  const h = window.visualViewport?.height ?? window.innerHeight;
  return computeObjectCoverLayout(
    w,
    h,
    viewport,
    HOME_FOREST_SIGN_OBJECT_POSITION[viewport],
  );
}

/** 画面いっぱいの object-cover 背景＋看板テキスト（ログハウスと同じ昼/夜連動） */
export function HomeForestSignStage({
  viewport,
  navById,
  primaryNavId,
  isLoggedIn,
  className = "",
  timeOfDayOverride,
}: Props) {
  const stageRef = useRef<HTMLDivElement>(null);
  const objectPosition = HOME_FOREST_SIGN_OBJECT_POSITION[viewport];
  const { timeOfDay: themeTimeOfDay } = useLogHouseRoomTimeTheme();
  const timeOfDay = timeOfDayOverride ?? themeTimeOfDay;
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

  const bgByTime = HOME_FOREST_SIGN_BG_BY_TIME[viewport];

  return (
    <div
      ref={stageRef}
      className={className}
      style={{
        position: "absolute",
        inset: 0,
        backgroundColor: timeOfDay === "night" ? "#121820" : "#ebe4d4",
      }}
    >
      {(["day", "night"] as const).map((id) => (
        <Image
          key={id}
          src={bgByTime[id]}
          alt=""
          fill
          sizes={viewport === "mobile" ? "100vw" : "(min-width: 1024px) 100vw"}
          className={[
            "object-cover transition-opacity duration-700 ease-in-out",
            timeOfDay === id ? "opacity-100" : "opacity-0",
          ].join(" ")}
          style={{ objectPosition: objectPositionCss(objectPosition) }}
          priority={id === timeOfDay}
          unoptimized
        />
      ))}
      <HomeForestSignOverlay
        viewport={viewport}
        navById={navById}
        primaryNavId={primaryNavId}
        coverLayout={coverLayout}
        timeOfDay={timeOfDay}
      />
      <HomeForestSignLoginNote
        viewport={viewport}
        coverLayout={coverLayout}
        isLoggedIn={isLoggedIn}
        timeOfDay={timeOfDay}
      />
    </div>
  );
}
