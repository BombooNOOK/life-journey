import {
  LOG_HOUSE_ROOM_GO_OUT_HOTSPOT,
  LOG_HOUSE_ROOM_HOTSPOTS,
  type LogHouseRoomSpotId,
} from "@/lib/loghouse/logHouseRoomHotspots";
import { LOG_HOUSE_ROOM_MAILBOX_HOTSPOT } from "@/lib/loghouse/logHouseMailboxLayout";

/** cover 時に部屋のどこを画面内に残すか（横長画面の切り落ち対策） */
export type LogHouseRoomCoverAlign = "center" | "top" | "bottom";

export type LogHouseRoomCoverFocus = {
  align: LogHouseRoomCoverAlign;
  /** ステージ上の焦点 X（%・左右の寄せ用） */
  xPct: number;
};

function hotspotCenterX(spot: { x: number; width: number }): number {
  return spot.x + spot.width / 2;
}

function resolveHotspot(spotId: LogHouseRoomSpotId) {
  if (spotId === "mailbox") return LOG_HOUSE_ROOM_MAILBOX_HOTSPOT;
  if (spotId === "goOut") return LOG_HOUSE_ROOM_GO_OUT_HOTSPOT;
  return LOG_HOUSE_ROOM_HOTSPOTS.find((s) => s.id === spotId) ?? null;
}

/**
 * cover 表示で切り落ちやすい家具を、案内中にビューポート内へ寄せる。
 * top/bottom は親が実寸を持つ前提で、上下端合わせ（%焦点より壊れにくい）。
 */
export function resolveLogHouseRoomCoverFocus(
  spotId: LogHouseRoomSpotId | null | undefined,
): LogHouseRoomCoverFocus | null {
  if (!spotId) return null;
  const hotspot = resolveHotspot(spotId);
  if (!hotspot) return null;
  const xPct = hotspotCenterX(hotspot);

  if (spotId === "mailbox" || spotId === "goOut" || spotId === "radio") {
    return { align: "bottom", xPct };
  }
  if (spotId === "bookshelf" || spotId === "residentCard") {
    return { align: "top", xPct };
  }
  return { align: "center", xPct };
}

/** 案内カードを画面上に置くか（下の家具を隠さない） */
export function shouldPinTourCardToTop(spotId: LogHouseRoomSpotId | null | undefined): boolean {
  return spotId === "mailbox" || spotId === "goOut" || spotId === "radio";
}
