"use client";

import Image from "next/image";
import type { ReactNode } from "react";

type Illustration = {
  src: string;
  width: number;
  height: number;
  alt?: string;
};

type Tone = "emerald" | "wood" | "shelf" | "fortune";

const toneClass: Record<
  Tone,
  { card: string; iconWrap: string; arrow: string; title: string; description: string }
> = {
  emerald: {
    card: "border-[#d9e0c4]/95 bg-gradient-to-br from-[#fdf9f1] via-[#fbf7ef] to-[#eef3e4]/55 hover:border-[#c5d0a8] hover:shadow-[0_8px_20px_rgba(90,70,45,0.08)]",
    iconWrap: "bg-[#f4f0e4] ring-[#e4dec8]/90",
    arrow: "text-[#b7ab93] group-hover:text-[#5f7348]",
    title: "text-[#3d3226]",
    description: "text-[#6e5c48]",
  },
  wood: {
    card: "border-[#e4d5c0]/95 bg-gradient-to-br from-[#fdf8f0] via-[#faf4ea] to-[#f3eadc]/70 hover:border-[#d5c3a8] hover:shadow-[0_8px_20px_rgba(90,70,45,0.08)]",
    iconWrap: "bg-[#f5efe6] ring-[#ebe2d6]",
    arrow: "text-[#c4b296] group-hover:text-[#7a6248]",
    title: "text-[#3d3226]",
    description: "text-[#6e5c48]",
  },
  shelf: {
    card: "border-[#CDBB9C] bg-[#FFFBF2] hover:border-[#bfa888] hover:shadow-[0_8px_20px_rgba(90,70,45,0.08)]",
    iconWrap: "bg-[#f7f0e4] ring-[#e8dcc8]",
    arrow: "text-[#c4b296] group-hover:text-[#6B5638]",
    title: "text-[#6B5638]",
    description: "text-[#6B5638]/80",
  },
  fortune: {
    card: "border-[#d9c9a8] bg-gradient-to-br from-[#fffaf3] via-[#fbf6ec] to-[#f3ead8]/70 hover:border-[#c4b08e] hover:shadow-[0_8px_20px_rgba(90,70,45,0.08)]",
    iconWrap: "bg-[#faf4e8] ring-[#eadfce]",
    arrow: "text-[#c4b296] group-hover:text-[#8a6b42]",
    title: "text-[#3d3226]",
    description: "text-[#6e5c48]",
  },
};

type Props = {
  illustration: Illustration;
  title: ReactNode;
  description: string;
  tone?: Tone;
  emphasis?: boolean;
  disabled?: boolean;
  /** カード内の控えめな補足ラベル（例: 毎日更新） */
  supplementLabel?: string;
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
  supplementLabel,
  className = "",
  children,
}: Props) {
  const palette = toneClass[tone];

  return (
    <div
      className={[
        "group relative w-full overflow-hidden rounded-[1.25rem] border p-3.5 shadow-[0_6px_18px_rgba(90,70,45,0.06)] transition sm:p-4",
        palette.card,
        emphasis ? "ring-2 ring-[#c5d0a8]/70" : "",
        disabled ? "cursor-not-allowed opacity-65 shadow-none hover:shadow-[0_6px_18px_rgba(90,70,45,0.06)]" : "",
        className,
      ].join(" ")}
    >
      <div className="flex items-center gap-3.5 sm:gap-4">
        <div
          className={[
            "flex h-[4.25rem] w-[4.25rem] shrink-0 items-center justify-center overflow-hidden rounded-xl p-1.5 ring-1 sm:h-[4.5rem] sm:w-[4.5rem]",
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
          <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
            <p
              className={[
                "text-base font-semibold leading-snug",
                emphasis ? "text-emerald-950" : palette.title,
              ].join(" ")}
            >
              {title}
            </p>
            {supplementLabel ? (
              <span className="rounded-full bg-white/70 px-1.5 py-0.5 text-[10px] font-medium leading-none text-stone-500 ring-1 ring-stone-200/70">
                {supplementLabel}
              </span>
            ) : null}
          </div>
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
