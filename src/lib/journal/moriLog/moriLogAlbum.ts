import type { MoriLogMediaType } from "@/lib/journal/moriLog/moriLogMedia";

/**
 * ひとやすみの椅子 — 森ログアルバム（メタのみ）。
 * メディア本体は MoriLogMedia を id 参照する（複製しない）。
 */
export type MoriLogAlbum = {
  id: string;
  profileId: string;
  title: string;
  /** まとめた順 */
  mediaIds: string[];
  /** 表紙に使うメディア id（通常は先頭） */
  coverMediaId: string;
  /** 表紙がカードかムービーか（メディア削除後もバッジ用に残す） */
  coverType: Extract<MoriLogMediaType, "card_image" | "card_movie">;
  createdAt: string;
  updatedAt: string;
};

export type MoriLogAlbumCreateInput = {
  profileId: string;
  title: string;
  mediaIds: string[];
  coverMediaId: string;
  coverType: MoriLogAlbum["coverType"];
  id?: string;
  createdAt?: string;
  updatedAt?: string;
};

export function createMoriLogAlbumId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `mori-album-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

export function defaultMoriLogAlbumTitle(iso = new Date().toISOString()): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "無題のアルバム";
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}/${m}/${day}のアルバム`;
}
