import Link from "next/link";

import { DecorationImage } from "@/components/ui/DecorationImage";
import {
  SoftIllustrationAccent,
  type SoftIllustrationVariant,
} from "@/components/ui/SoftIllustrationAccent";
import type { DecorationName } from "@/lib/decorations/catalog";

function cx(...parts: (string | false | undefined)[]) {
  return parts.filter(Boolean).join(" ");
}

type Props = {
  title: string;
  description?: React.ReactNode;
  backLink?: { href: string; label: string };
  eyebrow?: string;
  /** guide=控えめ / diary=読み物向け */
  tone?: "guide" | "diary";
  /** 画像挿絵（diary タイトルでは owl-md 推奨） */
  decoration?: DecorationName;
  cornerAccents?: SoftIllustrationVariant[];
};

export function PageTitleWithAccent({
  title,
  description,
  backLink,
  eyebrow = "BambooNOOK / Life Journey Diary",
  tone = "diary",
  decoration = tone === "diary" ? "owl-md" : undefined,
  cornerAccents = tone === "diary" ? [] : ["book", "leaf"],
}: Props) {
  const shell =
    tone === "diary"
      ? "border-emerald-100 bg-gradient-to-br from-white via-stone-50 to-emerald-50/50"
      : "border-stone-200 bg-gradient-to-br from-white via-stone-50/80 to-emerald-50/30";

  return (
    <div className={cx("relative overflow-hidden rounded-2xl border p-5 shadow-sm sm:rounded-3xl sm:p-6", shell)}>
      {backLink ? (
        <Link href={backLink.href} className="relative z-10 text-sm text-stone-600 hover:text-stone-900">
          {backLink.label}
        </Link>
      ) : null}

      <div className="relative z-10 mt-2">
        <p className="text-xs tracking-wide text-emerald-800/90 sm:text-sm">{eyebrow}</p>
        <h1 className="mt-2 text-2xl font-bold tracking-tight text-stone-900 sm:text-3xl">{title}</h1>
        {description ? (
          <div className="mt-3 text-sm leading-7 text-stone-600 sm:text-[15px] sm:leading-8">{description}</div>
        ) : null}
      </div>

      {decoration ? (
        <div className="pointer-events-none absolute right-3 top-3 z-0 hidden select-none sm:right-4 sm:top-4 sm:block">
          <DecorationImage
            name={decoration}
            size="lg"
            hideBelowSm
            fallback={<SoftIllustrationAccent variant="owl" size="lg" tone="emerald" />}
          />
        </div>
      ) : null}
      {cornerAccents[0] ? (
        <div className="pointer-events-none absolute right-4 top-4 hidden select-none sm:block">
          <SoftIllustrationAccent variant={cornerAccents[0]} size="lg" tone="emerald" />
        </div>
      ) : null}
      {cornerAccents[1] ? (
        <div className="pointer-events-none absolute bottom-3 right-14 hidden select-none sm:block">
          <SoftIllustrationAccent variant={cornerAccents[1]} size="md" tone="amber" />
        </div>
      ) : null}
    </div>
  );
}
