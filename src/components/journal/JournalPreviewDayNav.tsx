import Link from "next/link";

import { journalPreviewPath } from "@/lib/journal/journalNav";
import type { JournalPreviewNeighbors } from "@/lib/journal/journalPreviewNeighbors";

type Props = {
  neighbors: JournalPreviewNeighbors;
  designTheme: string;
  returnTo: string | null;
  profileId?: string;
};

const linkClass =
  "inline-flex min-h-[44px] items-center text-sm font-medium text-stone-600 underline-offset-2 transition hover:text-stone-900 hover:underline";

/** 日記プレビュー下部：前後の記録へ移動 */
export function JournalPreviewDayNav({ neighbors, designTheme, returnTo, profileId }: Props) {
  const { prev, next } = neighbors;
  if (!prev && !next) return null;

  const returnPath = returnTo ?? "/journal/preview";

  function hrefFor(entryId: string): string {
    return journalPreviewPath(entryId, designTheme, returnPath, profileId);
  }

  return (
    <nav
      className="flex items-center justify-between gap-3 border-t border-stone-200/80 pt-4"
      aria-label="前後の日記"
    >
      {prev ? (
        <Link href={hrefFor(prev.id)} className={linkClass}>
          ← 前の日
          <span className="sr-only">（{prev.dayLabel}）</span>
        </Link>
      ) : (
        <span className="min-h-[44px] w-16" aria-hidden />
      )}
      {next ? (
        <Link href={hrefFor(next.id)} className={`${linkClass} ml-auto`}>
          次の日 →
          <span className="sr-only">（{next.dayLabel}）</span>
        </Link>
      ) : (
        <span className="min-h-[44px] w-16" aria-hidden />
      )}
    </nav>
  );
}
