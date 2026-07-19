"use client";

import Image from "next/image";
import type { CSSProperties, ReactNode } from "react";

import type { ForestBookshelfRect } from "@/lib/ljd/forestBookshelfLayout";

function rectStyle(rect: ForestBookshelfRect): CSSProperties {
  return {
    left: `${rect.left}%`,
    top: `${rect.top}%`,
    width: `${rect.width}%`,
    height: `${rect.height}%`,
  };
}

type ItemProps = {
  rect: ForestBookshelfRect;
  src: string;
  alt: string;
  /** 前面度（床ランタンなど） */
  zIndex?: number;
  className?: string;
  /** 選択中：少し浮いて明るく */
  emphasized?: boolean;
  children?: ReactNode;
};

/** 本棚上の装飾／本ビジュアル */
export function ForestBookshelfItem({
  rect,
  src,
  alt,
  zIndex = 2,
  className = "",
  emphasized = false,
  children,
}: ItemProps) {
  return (
    <div
      className={[
        "pointer-events-none absolute transition duration-150",
        emphasized ? "-translate-y-1 brightness-110" : "",
        className,
      ].join(" ")}
      style={{ ...rectStyle(rect), zIndex }}
      aria-hidden={alt === "" ? true : undefined}
    >
      <Image
        src={src}
        alt={alt}
        fill
        className={[
          // 480×480 寄りのPNGを棚枠に入れると、中央寄せだと棚板から浮く
          "object-contain object-bottom",
          emphasized
            ? "drop-shadow-[0_10px_14px_rgba(60,40,20,0.35)]"
            : "drop-shadow-[0_6px_10px_rgba(60,40,20,0.22)]",
        ].join(" ")}
        sizes="(max-width: 640px) 40vw, 220px"
        unoptimized
        draggable={false}
      />
      {emphasized ? (
        <span
          className="pointer-events-none absolute inset-[6%] rounded-md ring-2 ring-[#c5b089]/70"
          aria-hidden
        />
      ) : null}
      {children}
    </div>
  );
}

type SpotProps = {
  rect: ForestBookshelfRect;
  label: string;
  onActivate: () => void;
  disabled?: boolean;
  selected?: boolean;
  /** はじめて案内：次にタップしてほしい場所 */
  spotlight?: boolean;
};

/** 見た目より少し広いタップ領域 */
export function ForestBookshelfTapSpot({
  rect,
  label,
  onActivate,
  disabled = false,
  selected = false,
  spotlight = false,
}: SpotProps) {
  return (
    <button
      type="button"
      disabled={disabled}
      aria-label={label}
      onClick={onActivate}
      className={[
        spotlight ? "absolute z-[26]" : "absolute z-[4]",
        "rounded-lg transition duration-150",
        "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#a67c3d]",
        disabled
          ? "pointer-events-none opacity-0"
          : "active:-translate-y-0.5 active:brightness-110",
        selected
          ? "ring-2 ring-[#a8b08f]/90 ring-offset-1 ring-offset-[#ebe2d4] brightness-105"
          : "hover:brightness-105",
        spotlight
          ? "border-2 border-amber-100 bg-amber-100/40 shadow-[0_0_0_3px_rgba(251,191,36,0.55),0_0_36px_rgba(251,191,36,0.65)] forest-bookshelf-spot-pulse"
          : "",
      ].join(" ")}
      style={rectStyle(rect)}
    >
      {spotlight ? (
        <style>{`
          .forest-bookshelf-spot-pulse {
            animation: forest-bookshelf-spot-pulse 1.35s ease-in-out infinite;
          }
          @keyframes forest-bookshelf-spot-pulse {
            0%, 100% { filter: brightness(1.05); box-shadow: 0 0 0 3px rgba(251,191,36,0.5), 0 0 28px rgba(251,191,36,0.45); }
            50% { filter: brightness(1.18); box-shadow: 0 0 0 5px rgba(251,191,36,0.75), 0 0 44px rgba(251,191,36,0.8); }
          }
        `}</style>
      ) : null}
    </button>
  );
}
