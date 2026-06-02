"use client";

import Image from "next/image";
import { useState } from "react";

import {
  getDecorationAsset,
  type DecorationName,
} from "@/lib/decorations/catalog";

function cx(...parts: (string | false | undefined)[]) {
  return parts.filter(Boolean).join(" ");
}

const SIZE_SCALE = {
  sm: 0.75,
  md: 1,
  lg: 1.35,
} as const;

type Props = {
  name: DecorationName;
  size?: keyof typeof SIZE_SCALE;
  className?: string;
  /** 640px未満で非表示（タイトル横など） */
  hideBelowSm?: boolean;
  /** 画像読み込み失敗時（未配置の leaf 等） */
  fallback?: React.ReactNode;
};

/** 装飾専用の軽量挿絵（alt 空・aria-hidden） */
export function DecorationImage({
  name,
  size = "md",
  className,
  hideBelowSm = false,
  fallback = null,
}: Props) {
  const asset = getDecorationAsset(name);
  const [src, setSrc] = useState(asset.src);
  const [failed, setFailed] = useState(false);
  const scale = SIZE_SCALE[size];
  const w = Math.round(asset.width * scale);
  const h = Math.round(asset.height * scale);

  if (failed) {
    return fallback ? <>{fallback}</> : null;
  }

  return (
    <Image
      src={src}
      alt=""
      aria-hidden
      width={w}
      height={h}
      className={cx(
        "pointer-events-none shrink-0 select-none object-contain opacity-85",
        hideBelowSm && "hidden sm:block",
        className,
      )}
      onError={() => {
        const placeholder = asset.placeholderSrc;
        if (placeholder && src !== placeholder) {
          setSrc(placeholder);
          return;
        }
        setFailed(true);
      }}
    />
  );
}
