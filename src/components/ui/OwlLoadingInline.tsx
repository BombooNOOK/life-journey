import { OwlSpinIndicator } from "@/components/ui/OwlSpinIndicator";

type Props = {
  label: string;
  size?: "sm" | "md";
  className?: string;
};

/** ボタン内・インラインのフクロウ＋文言（押下フィードバック用） */
export function OwlLoadingInline({ label, size = "sm", className }: Props) {
  return (
    <span
      className={["inline-flex items-center justify-center gap-2", className]
        .filter(Boolean)
        .join(" ")}
      role="status"
    >
      <OwlSpinIndicator size={size} />
      <span>{label}</span>
    </span>
  );
}
