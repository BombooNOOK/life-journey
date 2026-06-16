"use client";

import Image from "next/image";
import { useState } from "react";

import { getDecorationAsset, type DecorationName } from "@/lib/decorations/catalog";

export type CharacterFaceIconName = Extract<
  DecorationName,
  | "character-owl-face"
  | "character-sloth-face"
  | "character-squirrel-face"
  | "character-hedgehog-face"
  | "character-kerosion-face"
>;

const FACE_FRAME_CLASS =
  "relative mt-0.5 h-9 w-9 shrink-0 overflow-hidden rounded-full border border-stone-200/45 bg-[#faf6ef] shadow-[0_1px_2px_rgba(107,90,74,0.06)] sm:h-10 sm:w-10";

type FaceTuning = {
  objectPosition: string;
  scale: number;
};

const FACE_TUNING: Record<CharacterFaceIconName, FaceTuning> = {
  "character-owl-face": { objectPosition: "50% 48%", scale: 1.08 },
  "character-sloth-face": { objectPosition: "50% 44%", scale: 1.14 },
  "character-squirrel-face": { objectPosition: "50% 36%", scale: 1.1 },
  "character-hedgehog-face": { objectPosition: "50% 42%", scale: 1.02 },
  "character-kerosion-face": { objectPosition: "50% 40%", scale: 1.12 },
};

/** 会話用：丸背景に収めた顔アイコン */
export function CharacterFaceIcon({
  name,
  frameClassName,
  imageClassName,
}: {
  name: CharacterFaceIconName;
  /** 返答ボックス内など、枠背景を消したいとき */
  frameClassName?: string;
  /** 画像側の調整（白縁の馴染みなど） */
  imageClassName?: string;
}) {
  const asset = getDecorationAsset(name);
  const tuning = FACE_TUNING[name];
  const [failed, setFailed] = useState(false);

  if (failed) {
    return <span aria-hidden className={[FACE_FRAME_CLASS, frameClassName].filter(Boolean).join(" ")} />;
  }

  return (
    <span aria-hidden className={[FACE_FRAME_CLASS, frameClassName].filter(Boolean).join(" ")}>
      <Image
        src={asset.src}
        alt=""
        width={asset.width}
        height={asset.height}
        className={["absolute inset-0 h-full w-full object-cover", imageClassName].filter(Boolean).join(" ")}
        style={{
          objectPosition: tuning.objectPosition,
          transform: `scale(${tuning.scale})`,
        }}
        onError={() => setFailed(true)}
      />
    </span>
  );
}
