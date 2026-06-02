export type SoftIllustrationVariant = "owl" | "book" | "leaf" | "moon" | "footprints" | "star";

function cx(...parts: (string | false | undefined)[]) {
  return parts.filter(Boolean).join(" ");
}

type Props = {
  variant?: SoftIllustrationVariant;
  size?: "sm" | "md" | "lg";
  className?: string;
  /** 装飾色のトーン */
  tone?: "emerald" | "amber" | "stone";
};

const SIZE_CLASS = {
  sm: "text-2xl",
  md: "text-3xl",
  lg: "text-4xl sm:text-5xl",
} as const;

const TONE_CLASS = {
  emerald: "text-emerald-900/15",
  amber: "text-amber-800/15",
  stone: "text-stone-600/15",
} as const;

/** 画像なし・CSS/文字のみの淡いモチーフ（aria-hidden 前提） */
export function SoftIllustrationAccent({
  variant = "moon",
  size = "md",
  className,
  tone = "emerald",
}: Props) {
  if (variant === "leaf") {
    return (
      <span
        aria-hidden="true"
        className={cx(
          "pointer-events-none inline-block select-none opacity-20",
          SIZE_CLASS[size],
          TONE_CLASS[tone],
          className,
        )}
      >
        <span
          className="inline-block h-[0.55em] w-[0.35em] rotate-[-24deg] rounded-[999px_999px_0_999px] bg-current"
        />
      </span>
    );
  }

  if (variant === "book") {
    return (
      <span
        aria-hidden="true"
        className={cx(
          "pointer-events-none inline-flex select-none items-end gap-[0.08em] opacity-20",
          SIZE_CLASS[size],
          TONE_CLASS[tone],
          className,
        )}
      >
        <span className="inline-block h-[0.5em] w-[0.22em] rounded-sm border border-current bg-current/30" />
        <span className="inline-block h-[0.42em] w-[0.18em] rounded-sm border border-current" />
      </span>
    );
  }

  if (variant === "footprints") {
    return (
      <span
        aria-hidden="true"
        className={cx(
          "pointer-events-none inline-flex select-none gap-[0.15em] text-[0.65em] tracking-widest opacity-25",
          TONE_CLASS[tone],
          className,
        )}
      >
        <span>··</span>
        <span className="translate-y-[0.08em]">··</span>
      </span>
    );
  }

  const symbols: Record<Exclude<SoftIllustrationVariant, "leaf" | "book" | "footprints">, string> = {
    owl: "🦉",
    moon: "☾",
    star: "✦",
  };

  return (
    <span
      aria-hidden="true"
      className={cx(
        "pointer-events-none inline-block select-none leading-none opacity-[0.12]",
        SIZE_CLASS[size],
        TONE_CLASS[tone],
        className,
      )}
    >
      {symbols[variant as keyof typeof symbols]}
    </span>
  );
}
