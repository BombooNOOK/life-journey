import { OwlLoadingPanel } from "@/components/ui/OwlLoadingPanel";

type Props = {
  label?: string;
  hint?: string;
};

/** Suspense 境界用：テキストだけの「読み込み中」をフクロウ表示に統一 */
export function OwlSuspenseFallback({
  label = "読み込んでいます…",
  hint,
}: Props) {
  return <OwlLoadingPanel label={label} hint={hint} layout="section" size="sm" />;
}
