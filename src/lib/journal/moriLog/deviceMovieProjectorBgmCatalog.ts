/**
 * 端末動画「森の映写便り」向け BGM。
 * 日記由来ムービー（音楽堂）とは別カタログ。ピッカー UI は共通の MoriLogBgmPicker を再利用。
 */

import type { MoriLogBgmTrack } from "@/lib/journal/moriLog/moriLogBgmCatalog";

/** 最大クリップ 10 秒＋フェード用に、15 秒の仮音源を配置 */
export const DEVICE_MOVIE_PROJECTOR_BGM_TRACKS: readonly MoriLogBgmTrack[] = [
  {
    id: "projector001",
    title: "映写機の曲 1",
    description: "森の映写便り用の仮BGM（約15秒）",
    category: "bgm",
    src: "/audio/forest/device-movie-projector/projector001.mp3",
  },
  {
    id: "projector002",
    title: "映写機の曲 2",
    description: "森の映写便り用の仮BGM（約15秒）",
    category: "bgm",
    src: "/audio/forest/device-movie-projector/projector002.mp3",
  },
  {
    id: "projector003",
    title: "映写機の曲 3",
    description: "森の映写便り用の仮BGM（約15秒）",
    category: "bgm",
    src: "/audio/forest/device-movie-projector/projector003.mp3",
  },
];

export function getDeviceMovieProjectorBgmTrack(
  bgmId: string | null | undefined,
): MoriLogBgmTrack | null {
  if (!bgmId) return null;
  return DEVICE_MOVIE_PROJECTOR_BGM_TRACKS.find((t) => t.id === bgmId) ?? null;
}

export function isDeviceMovieProjectorBgmId(bgmId: string): boolean {
  return DEVICE_MOVIE_PROJECTOR_BGM_TRACKS.some((t) => t.id === bgmId);
}
