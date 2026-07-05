import { OwlLoadingPanel } from "@/components/ui/OwlLoadingPanel";

type Props = {
  label?: string;
  hint?: string;
};

/** マイページ配下のサブ画面：サーバー読み込み中のフクロウ表示 */
export function MyPageSubpageLoading({
  label = "読み込んでいます…",
  hint,
}: Props) {
  return (
    <OwlLoadingPanel
      label={label}
      hint={hint}
      layout="page"
      size="md"
      className="mx-auto w-full max-w-md min-h-[32vh]"
    />
  );
}
