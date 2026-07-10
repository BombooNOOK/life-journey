"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";

import {
  LOG_HOUSE_ROOM_RABBIT_GREETING,
  LOG_HOUSE_ROOM_SPOT_COPY,
} from "@/lib/loghouse/logHouseRoomCopy";
import {
  LOG_HOUSE_ROOM_RABBIT_POSE_SRC,
  type LogHouseRoomRabbitPose,
} from "@/lib/loghouse/logHouseRoomAssets";
import {
  LOG_HOUSE_ROOM_RABBIT_PLACEMENT,
  LOG_HOUSE_ROOM_RABBIT_WAYPOINTS,
} from "@/lib/loghouse/logHouseRoomLayout";

type Props = {
  className?: string;
};

type Point = { x: number; y: number };

const POSES = Object.keys(LOG_HOUSE_ROOM_RABBIT_POSE_SRC) as LogHouseRoomRabbitPose[];

function randomBetween(minMs: number, maxMs: number) {
  return minMs + Math.floor(Math.random() * (maxMs - minMs + 1));
}

function pickNextWaypoint(current: Point): Point {
  const options = LOG_HOUSE_ROOM_RABBIT_WAYPOINTS.filter(
    (point) => Math.hypot(point.x - current.x, point.y - current.y) > 4,
  );
  const pool = options.length > 0 ? options : [...LOG_HOUSE_ROOM_RABBIT_WAYPOINTS];
  return pool[Math.floor(Math.random() * pool.length)]!;
}

function walkDurationMs(from: Point, to: Point) {
  const distance = Math.hypot(to.x - from.x, to.y - from.y);
  return Math.round(Math.min(9000, Math.max(2800, distance * 220)));
}

/** ログハウス室内の分身うさぎ（立ち・瞬き・歩き） */
export function LogHouseRoomRabbitAvatar({ className = "" }: Props) {
  const placement = LOG_HOUSE_ROOM_RABBIT_PLACEMENT;
  const home = LOG_HOUSE_ROOM_RABBIT_WAYPOINTS[0]!;

  const [pose, setPose] = useState<LogHouseRoomRabbitPose>("idle");
  const [position, setPosition] = useState<Point>(home);
  const [moveMs, setMoveMs] = useState(0);
  const [walking, setWalking] = useState(false);
  const [showBubble, setShowBubble] = useState(false);
  const [tapBounce, setTapBounce] = useState(false);
  const [reduceMotion, setReduceMotion] = useState(false);

  const positionRef = useRef(position);
  positionRef.current = position;
  const walkingRef = useRef(false);
  const generationRef = useRef(0);

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setReduceMotion(media.matches);
    sync();
    media.addEventListener("change", sync);
    return () => media.removeEventListener("change", sync);
  }, []);

  useEffect(() => {
    Object.values(LOG_HOUSE_ROOM_RABBIT_POSE_SRC).forEach((src) => {
      const img = new window.Image();
      img.src = src;
    });
  }, []);

  useEffect(() => {
    const generation = ++generationRef.current;
    const timers: number[] = [];

    const alive = () => generationRef.current === generation;
    const later = (fn: () => void, ms: number) => {
      const id = window.setTimeout(() => {
        if (alive()) fn();
      }, ms);
      timers.push(id);
    };

    const scheduleBlink = () => {
      later(() => {
        if (walkingRef.current) {
          scheduleBlink();
          return;
        }
        setPose("blink");
        later(() => {
          if (!walkingRef.current) setPose("idle");
          scheduleBlink();
        }, 160);
      }, randomBetween(2400, 4800));
    };

    const scheduleNextWalk = () => {
      if (reduceMotion) return;
      later(() => {
        const current = positionRef.current;
        const next = pickNextWaypoint(current);
        const duration = walkDurationMs(current, next);
        const facingRight = next.x >= current.x;

        walkingRef.current = true;
        setWalking(true);
        setPose(facingRight ? "walkRight" : "walkLeft");
        setMoveMs(duration);

        later(() => {
          setPosition(next);
        }, 40);

        later(() => {
          walkingRef.current = false;
          setWalking(false);
          setPose("idle");
          setMoveMs(0);
          scheduleNextWalk();
        }, duration + 120);
      }, randomBetween(5200, 9000));
    };

    scheduleBlink();
    scheduleNextWalk();

    return () => {
      generationRef.current += 1;
      timers.forEach((id) => window.clearTimeout(id));
      walkingRef.current = false;
    };
  }, [reduceMotion]);

  const handleTap = useCallback(() => {
    setShowBubble((prev) => !prev);
    setTapBounce(true);
    window.setTimeout(() => setTapBounce(false), 280);
  }, []);

  const motionClass = tapBounce
    ? "scale-105 -translate-y-1"
    : walking
      ? "animate-[loghouseRabbitWalkBob_0.55s_ease-in-out_infinite]"
      : reduceMotion
        ? ""
        : "animate-[loghouseRabbitIdle_3.5s_ease-in-out_infinite]";

  return (
    <button
      type="button"
      aria-label="うさぎさん"
      onClick={handleTap}
      className={[
        "absolute transition-transform duration-200 ease-out",
        motionClass,
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      style={{
        left: `${position.x}%`,
        top: `${position.y}%`,
        width: `${placement.width}%`,
        height: `${placement.height}%`,
        zIndex: placement.zIndex,
        transitionProperty: moveMs > 0 ? "left, top, transform" : "transform",
        transitionDuration: moveMs > 0 ? `${moveMs}ms` : "200ms",
        transitionTimingFunction: walking ? "linear" : "ease-out",
      }}
    >
      {showBubble ? (
        <span
          className="absolute -top-9 left-1/2 z-30 w-max max-w-[10rem] -translate-x-1/2 rounded-xl border border-emerald-100 bg-white/95 px-2.5 py-1.5 text-center text-[11px] font-medium leading-snug text-stone-700 shadow-sm"
          role="status"
        >
          {LOG_HOUSE_ROOM_RABBIT_GREETING}
        </span>
      ) : null}
      <span className="absolute inset-0">
        {POSES.map((poseId) => (
          <Image
            key={poseId}
            src={LOG_HOUSE_ROOM_RABBIT_POSE_SRC[poseId]}
            alt=""
            fill
            className={[
              "object-contain object-bottom drop-shadow-[0_4px_12px_rgba(74,55,40,0.18)] transition-opacity duration-100",
              pose === poseId ? "opacity-100" : "opacity-0",
            ].join(" ")}
            sizes="28vw"
            unoptimized
            priority={poseId === "idle"}
          />
        ))}
      </span>
      <span className="sr-only">{LOG_HOUSE_ROOM_SPOT_COPY.residentCard.label}</span>
    </button>
  );
}
