"use client";

import Image from "next/image";

import { LOG_HOUSE_ROOM_PART_SRC } from "@/lib/loghouse/logHouseRoomAssets";
import { LOG_HOUSE_ROOM_PART_PLACEMENTS } from "@/lib/loghouse/logHouseRoomLayout";

/** ログハウス室内の家具パーツ（背景の上に重ねる・操作不可） */
export function LogHouseRoomPartsLayer() {
  return (
    <div className="pointer-events-none absolute inset-0 z-10 overflow-hidden" aria-hidden>
      {LOG_HOUSE_ROOM_PART_PLACEMENTS.map((placement) => (
        <div
          key={placement.id}
          className="absolute"
          style={{
            left: `${placement.x}%`,
            top: `${placement.y}%`,
            width: `${placement.width}%`,
            height: `${placement.height}%`,
            zIndex: placement.zIndex,
          }}
        >
          <Image
            src={LOG_HOUSE_ROOM_PART_SRC[placement.id]}
            alt=""
            fill
            className="object-contain"
            style={{ objectPosition: placement.objectPosition ?? "center" }}
            sizes="45vw"
            unoptimized
          />
        </div>
      ))}
    </div>
  );
}
