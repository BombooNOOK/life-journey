import { DecorationImage } from "@/components/ui/DecorationImage";
import { SoftIllustrationAccent, type SoftIllustrationVariant } from "@/components/ui/SoftIllustrationAccent";
import type { DecorationName } from "@/lib/decorations/catalog";

type Props = {
  variant?: SoftIllustrationVariant;
  /** 挿絵（diary-guide では leaf-sm） */
  decoration?: DecorationName;
};

/** 読み物ページの章間区切り（装飾のみ・本文外） */
export function SoftSectionDivider({ variant = "leaf", decoration = "leaf-sm" }: Props) {
  return (
    <div className="my-6 flex items-center gap-3 sm:my-8" aria-hidden="true">
      <div className="h-px flex-1 bg-emerald-900/10" />
      <DecorationImage
        name={decoration}
        size="sm"
        className="opacity-90"
        fallback={<SoftIllustrationAccent variant={variant} size="sm" className="opacity-100" />}
      />
      <div className="h-px flex-1 bg-emerald-900/10" />
    </div>
  );
}
