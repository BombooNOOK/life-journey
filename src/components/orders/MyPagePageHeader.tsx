import { FieldLabelWithHelp } from "@/components/ui/InlineHelpButton";
import { MyPageHeaderIllustration } from "@/components/orders/MyPageHeaderIllustration";

/** マイページ見出し（説明は「？」内のみ） */
export function MyPagePageHeader() {
  return (
    <div className="flex items-start justify-between gap-3">
      <FieldLabelWithHelp
        label="マイページ"
        labelClassName="text-[1.625rem] font-bold text-stone-900 sm:text-2xl"
        helpAriaLabel="マイページの説明"
        help={<p>プロフィールを選ぶと、日記や本棚へ進めます。</p>}
      />
      <div className="hidden shrink-0 sm:block">
        <MyPageHeaderIllustration />
      </div>
    </div>
  );
}
