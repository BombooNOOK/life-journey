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
          "object-contain",
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
};

/** 見た目より少し広いタップ領域 */
export function ForestBookshelfTapSpot({
  rect,
  label,
  onActivate,
  disabled = false,
  selected = false,
}: SpotProps) {
  return (
    <button
      type="button"
      disabled={disabled}
      aria-label={label}
      onClick={onActivate}
      className={[
        "absolute z-[4] rounded-lg transition duration-150",
        "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#a67c3d]",
        disabled
          ? "pointer-events-none opacity-0"
          : "active:-translate-y-0.5 active:brightness-110",
        selected
          ? "ring-2 ring-[#a8b08f]/90 ring-offset-1 ring-offset-[#ebe2d4] brightness-105"
          : "hover:brightness-105",
      ].join(" ")}
      style={rectStyle(rect)}
    />
  );
}
