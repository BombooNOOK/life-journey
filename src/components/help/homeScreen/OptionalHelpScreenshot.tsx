"use client";

import { useState } from "react";

type Props = {
  src: string;
  alt: string;
  caption?: string;
};

/** 画像が未配置でもページが成立するよう、読み込み失敗時は非表示にする */
export function OptionalHelpScreenshot({ src, alt, caption }: Props) {
  const [visible, setVisible] = useState(true);

  if (!visible) return null;

  return (
    <figure className="mt-4 overflow-hidden rounded-xl border border-stone-200/80 bg-[#fffdf9] p-2 shadow-sm">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt={alt}
        className="mx-auto w-full max-w-sm rounded-lg"
        onError={() => setVisible(false)}
      />
      {caption ? (
        <figcaption className="mt-2 px-1 text-center text-xs leading-relaxed text-stone-500">
          {caption}
        </figcaption>
      ) : null}
    </figure>
  );
}
