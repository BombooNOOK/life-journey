import { OwlLoadingInline } from "@/components/ui/OwlLoadingInline";

type Props = {
  label?: string;
};

/** マイページ配下のサブ画面：サーバー読み込み中のフクロウ表示 */
export function MyPageSubpageLoading({ label = "読み込んでいます…" }: Props) {
  return (
    <div className="mx-auto flex w-full max-w-md justify-center px-4 py-20">
      <OwlLoadingInline label={label} size="md" className="text-sm text-stone-600" />
    </div>
  );
}
