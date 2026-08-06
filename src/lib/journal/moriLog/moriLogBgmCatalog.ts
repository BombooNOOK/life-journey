/**
 * 森ログムービー用 BGM（音楽ホールの森の音楽を流用）
 */

import {
  FOREST_MUSIC_HALL_TRACKS,
  type ForestMusicHallTrack,
} from "@/lib/help/forestMusicHallCatalog";

export type MoriLogBgmTrack = ForestMusicHallTrack;

/** ムービー向けに使える曲（自然音は除く） */
export const MORI_LOG_BGM_TRACKS: readonly MoriLogBgmTrack[] = FOREST_MUSIC_HALL_TRACKS.filter(
  (track) => track.category === "bgm",
);

export function getMoriLogBgmTrack(bgmId: string | null | undefined): MoriLogBgmTrack | null {
  if (!bgmId) return null;
  return MORI_LOG_BGM_TRACKS.find((track) => track.id === bgmId) ?? null;
}

export function isMoriLogBgmId(bgmId: string): boolean {
  return MORI_LOG_BGM_TRACKS.some((track) => track.id === bgmId);
}
