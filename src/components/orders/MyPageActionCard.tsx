"use client";

import Image from "next/image";
import type { ReactNode } from "react";

type Illustration = {
  src: string;
  width: number;
  height: number;
  alt?: string;
};

type Tone = "emerald" | "wood" | "shelf";

const toneClass: Record<
  Tone,
  { card: string; iconWrap: string; arrow: string; title: string; description: string }
> = {
  emerald: {
    card: "border-emerald-200/90 bg-gradient-to-br from-[#f8f6f0] via-white to-emerald-50/50 hover:border-emerald-300 hover:shadow-md",
    iconWrap: "bg-[#f8f6f0] ring-emerald-100/80",
    arrow: "group-hover:text-emerald-700",
    title: "text-stone-900",
    description: "text-stone-600",
  },
  wood: {
    card: "border-[#e5ddd0] bg-gradient-to-br from-[#faf7f1] via-white to-[#f3ebe0]/60 hover:border-[#d9cbb8] hover:shadow-md",
    iconWrap: "bg-[#f5efe6] ring-[#ebe2d6]",
    arrow: "group-hover:text-[#7a6248]",
    title: "text-stone-900",
    description: "text-stone-600",
  },
  shelf: {
    card: "border-[#CDBB9C] bg-[#FFFBF2] hover:border-[#bfa888] hover:shadow-md",
    iconWrap: "bg-[#f7f0e4] ring-[#e8dcc8]",
    arrow: "group-hover:text-[#6B5638]",
    title: "text-[#6B5638]",
    description: "text-[#6B5638]/80",
  },
};

type Props = {
  illustration: Illustration;
  title: string;
  description: string;
  tone?: Tone;
  emphasis?: boolean;
  disabled?: boolean;
  className?: string;
  children?: ReactNode;
};

/** マイページ：イラスト付きのやさしい選択カード（中身はボタン／リンクでラップ） */
export function MyPageActionCard({
  illustration,
  title,
  description,
  tone = "emerald",
  emphasis = false,
  disabled = false,
  className = "",
  children,
}: Props) {
  const palette = toneClass[tone];

  return (
    <div
      className={[
        "group relative w-full rounded-2xl border p-3.5 shadow-sm transition sm:p-4",
        palette.card,
        emphasis ? "ring-2 ring-emerald-200/70" : "",
        disabled ? "cursor-not-allowed opacity-65 shadow-none hover:shadow-sm" : "",
        className,
      ].join(" ")}
    >
      <div className="flex items-center gap-3.5 sm:gap-4">
        <div
          className={[
            "flex h-[4.25rem] w-[4.25rem] shrink-0 items-center justify-center rounded-xl p-1.5 ring-1 sm:h-[4.5rem] sm:w-[4.5rem]",
            palette.iconWrap,
          ].join(" ")}
        >
          <Image
            src={illustration.src}
            alt={illustration.alt ?? ""}
            aria-hidden={!illustration.alt}
            width={illustration.width}
            height={illustration.height}
            className="h-full w-full object-contain"
          />
        </div>
        <div className="min-w-0 flex-1">
          <p
            className={[
              "text-base font-semibold leading-snug",
              emphasis ? "text-emerald-950" : palette.title,
            ].join(" ")}
          >
            {title}
          </p>
          <p className={["mt-1 text-sm leading-relaxed", palette.description].join(" ")}>
            {description}
          </p>
        </div>
        {!disabled ? (
          <span
            aria-hidden
            className={[
              "shrink-0 pr-0.5 text-lg text-stone-300 transition",
              palette.arrow,
            ].join(" ")}
          >
            →
          </span>
        ) : null}
      </div>
      {children}
    </div>
  );
}
