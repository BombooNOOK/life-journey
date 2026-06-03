type Props = {
  className?: string;
  /** ボタン内は sm、横並び案内は md */
  size?: "sm" | "md";
};

/** 処理待ちのくるくる表示（PdfDownloadButton と同系の軽量表示） */
export function OwlSpinIndicator({ className, size = "md" }: Props) {
  const sizeClass = size === "sm" ? "text-base" : "text-lg";
  return (
    <span
      aria-hidden
      className={[
        "inline-block shrink-0 origin-center animate-spin leading-none",
        sizeClass,
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      🦉
    </span>
  );
}
