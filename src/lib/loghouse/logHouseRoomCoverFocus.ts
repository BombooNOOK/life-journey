import {
  LOG_HOUSE_ROOM_GO_OUT_HOTSPOT,
  LOG_HOUSE_ROOM_HOTSPOTS,
  type LogHouseRoomSpotId,
} from "@/lib/loghouse/logHouseRoomHotspots";
import { LOG_HOUSE_ROOM_MAILBOX_HOTSPOT } from "@/lib/loghouse/logHouseMailboxLayout";

export type LogHouseRoomCoverFocus = {
  /** ステージ上の焦点 X（%） */
  xPct: number;
  /** ステージ上の焦点 Y（%） */
  yPct: number;
  /** 焦点を合わせるビューポート上の Y（%・上端=0） */
  viewportYPct: number;
};

function hotspotCenter(spot: { x: number; y: number; width: number; height: number }): {
  xPct: number;
  yPct: number;
} {
  return {
    xPct: spot.x + spot.width / 2,
    yPct: spot.y + spot.height / 2,
  };
}

function resolveHotspot(spotId: LogHouseRoomSpotId) {
  if (spotId === "mailbox") return LOG_HOUSE_ROOM_MAILBOX_HOTSPOT;
  if (spotId === "goOut") return LOG_HOUSE_ROOM_GO_OUT_HOTSPOT;
  return LOG_HOUSE_ROOM_HOTSPOTS.find((s) => s.id === spotId) ?? null;
}

/**
 * cover 表示で切り落ちやすい家具を、案内中にビューポート内へ寄せる焦点。
 * 下寄りのポストなどはカードを上に逃がす前提で viewportY をやや下にする。
 */
export function resolveLogHouseRoomCoverFocus(
  spotId: LogHouseRoomSpotId | null | undefined,
): LogHouseRoomCoverFocus | null {
  if (!spotId) return null;
  const hotspot = resolveHotspot(spotId);
  if (!hotspot) return null;
  const { xPct, yPct } = hotspotCenter(hotspot);

  if (spotId === "mailbox" || spotId === "goOut" || spotId === "radio") {
    return { xPct, yPct, viewportYPct: 64 };
  }
  if (spotId === "bookshelf" || spotId === "residentCard") {
    return { xPct, yPct, viewportYPct: 36 };
  }
  // desk / todayResult
  return { xPct, yPct, viewportYPct: 40 };
}

/** 案内カードを画面上に置くか（下の家具を隠さない） */
export function shouldPinTourCardToTop(spotId: LogHouseRoomSpotId | null | undefined): boolean {
  return spotId === "mailbox" || spotId === "goOut" || spotId === "radio";
}
