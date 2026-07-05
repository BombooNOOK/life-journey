import { OwlLoadingInline } from "@/components/ui/OwlLoadingInline";
import { OwlSpinIndicator } from "@/components/ui/OwlSpinIndicator";

type Props = {
  label: string;
  hint?: string;
  /** page: 画面中央・縦余白大 / section: ブロック中央 / card: ログイン等のカード内 / inline: 横並びのみ */
  layout?: "page" | "section" | "card" | "inline";
  size?: "sm" | "md";
  className?: string;
};

const layoutClass: Record<NonNullable<Props["layout"]>, string> = {
  page: "flex min-h-[40vh] flex-col items-center justify-center gap-3 px-4 py-12 text-center",
  section: "flex flex-col items-center justify-center gap-3 px-4 py-10 text-center",
  card: "mx-auto flex w-full max-w-md flex-col items-center gap-3 rounded-xl border border-stone-200 bg-white p-8 text-center shadow-sm",
  inline: "",
};

const labelClass: Record<NonNullable<Props["size"]>, string> = {
  sm: "text-sm text-stone-600",
  md: "text-base font-medium text-stone-900",
};

/** 待ち時間が長くなりうる処理向け：くるくるフクロウ＋文言（＋任意で補足） */
export function OwlLoadingPanel({
  label,
  hint,
  layout = "section",
  size = "md",
  className,
}: Props) {
  if (layout === "inline") {
    return <OwlLoadingInline label={label} size={size} className={className} />;
  }

  return (
    <div
      className={[layoutClass[layout], className].filter(Boolean).join(" ")}
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <OwlSpinIndicator size={size} />
      <p className={labelClass[size]}>{label}</p>
      {hint ? (
        <p className="max-w-sm text-xs leading-relaxed text-stone-500">{hint}</p>
      ) : null}
    </div>
  );
}
