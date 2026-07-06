import Image from "next/image";

import {
  FOREST_RESIDENT_BADGE_LABEL,
  FOREST_RESIDENT_CARD_LAYOUT,
  FOREST_RESIDENT_CARD_SRC,
  forestResidentBadgeSrc,
  forestResidentFaceSrc,
  forestResidentFaceTuning,
} from "@/lib/forestResident/forestResidentAssets";
import type { ForestResidentBadge, ForestResidentFaceIcon } from "@/lib/forestResident/forestResidentNumber";

type Props = {
  residentNumber: string;
  displayName: string;
  registeredAtLabel: string;
  faceIcon: ForestResidentFaceIcon;
  badge: ForestResidentBadge;
};

const VALUE_CLASS =
  "absolute flex items-end truncate font-serif text-[calc(10px+2pt)] leading-none text-[#4a3f35] sm:text-[calc(11px+2pt)]";

const BADGE_LABEL_CLASS =
  "absolute flex items-end justify-center truncate text-center font-serif text-[9px] leading-tight text-emerald-900/85 sm:text-[10px]";

/** 森の住民票カード（初回発行・マイページ共通） */
export function ForestResidentCard({
  residentNumber,
  displayName,
  registeredAtLabel,
  faceIcon,
  badge,
}: Props) {
  const layout = FOREST_RESIDENT_CARD_LAYOUT;
  const faceTuning = forestResidentFaceTuning[faceIcon];
  const lineValues = [displayName, residentNumber, registeredAtLabel];

  return (
    <article
      className="relative mx-auto aspect-square w-full max-w-[22rem]"
      aria-label={`森の住民票 ${displayName}`}
    >
      <Image
        src={FOREST_RESIDENT_CARD_SRC}
        alt=""
        fill
        sizes="(max-width: 22rem) 352px, 352px"
        className="object-contain"
        priority
      />

      <div
        className="absolute overflow-hidden rounded-[50%]"
        style={{
          left: `${layout.face.left}%`,
          top: `${layout.face.top}%`,
          width: `${layout.face.width}%`,
          height: `${layout.face.height}%`,
        }}
      >
        <Image
          src={forestResidentFaceSrc[faceIcon]}
          alt=""
          fill
          sizes="110px"
          className="object-cover"
          style={{
            objectPosition: faceTuning.objectPosition,
            transform: `scale(${faceTuning.scale})`,
          }}
        />
      </div>

      {layout.lines.rows.map((top, index) => (
        <p
          key={top}
          className={VALUE_CLASS}
          style={{
            left: `${layout.lines.left}%`,
            top: `${top}%`,
            width: `${layout.lines.width}%`,
            height: `${layout.lines.height}%`,
          }}
        >
          {lineValues[index]}
        </p>
      ))}

      <div
        className="pointer-events-none absolute"
        style={{
          right: `${layout.badge.image.right}%`,
          bottom: `${layout.badge.image.bottom}%`,
          width: `${layout.badge.image.width}%`,
          aspectRatio: layout.badge.image.aspectRatio,
        }}
      >
        <Image
          src={forestResidentBadgeSrc[badge]}
          alt=""
          fill
          sizes="86px"
          className="object-contain drop-shadow-sm"
        />
      </div>

      <p
        className={BADGE_LABEL_CLASS}
        style={{
          left: `${layout.badge.label.left}%`,
          top: `${layout.badge.label.top}%`,
          width: `${layout.badge.label.width}%`,
          height: `${layout.badge.label.height}%`,
        }}
      >
        {FOREST_RESIDENT_BADGE_LABEL[badge]}
      </p>
    </article>
  );
}
