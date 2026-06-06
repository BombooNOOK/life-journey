import Image from "next/image";

import { moodOwlIconImagePath } from "@/lib/journal/moodAssets";
import { getMoodMeta } from "@/lib/journal/meta";

type Props = {
  moodId: string;
  sizePx: number;
  className?: string;
};

/** フクロウ先生の気分アイコン（アプリ・プレビュー共通） */
export function MoodOwlIcon({ moodId, sizePx, className }: Props) {
  const label = getMoodMeta(moodId).label;
  return (
    <Image
      src={moodOwlIconImagePath(moodId)}
      alt={label}
      width={sizePx}
      height={sizePx}
      className={className}
      style={{ width: sizePx, height: sizePx, objectFit: "contain" }}
      unoptimized
    />
  );
}
