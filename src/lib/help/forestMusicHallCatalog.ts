/** 森の小さな音楽堂 — 楽曲・効果音カタログ */

export const FOREST_MUSIC_HALL_PAGE_TITLE = "森の小さな音楽堂" as const;

export const FOREST_MUSIC_HALL_PAGE_DESCRIPTION =
  "BambooNOOKの森で暮らすうちに出会った音楽や、森の自然音を聴ける場所です。" as const;

export const FOREST_MUSIC_HALL_BACK_HREF = "/help/ljd" as const;

export type ForestMusicHallTrackCategory = "bgm" | "nature";

export type ForestMusicHallTrack = {
  id: string;
  title: string;
  description: string;
  category: ForestMusicHallTrackCategory;
  /** public/ からのパス（ファイル名は英数字推奨） */
  src: string;
};

export const FOREST_MUSIC_HALL_TRACK_CATEGORIES: Record<
  ForestMusicHallTrackCategory,
  { title: string; description: string }
> = {
  bgm: {
    title: "森の音楽",
    description: "LJDのなかで流れるBGMや、思い出の場面の音楽です。",
  },
  nature: {
    title: "自然の音",
    description: "焚き火や川のせせらぎなど、森の環境音です。",
  },
};

export const FOREST_MUSIC_HALL_TRACKS: ForestMusicHallTrack[] = [
  {
    id: "bgm-resident-registration",
    title: "森の案内所の日々",
    description: "住民登録のときのBGM",
    category: "bgm",
    src: "/audio/forest/music-hall/bgm_resident_registration.mp3",
  },
  {
    id: "bgm-intro-video",
    title: "木漏れ日ワルツ",
    description: "Life Journey Diary 紹介動画のBGM",
    category: "bgm",
    src: "/audio/forest/music-hall/bgm_intro_video.mp3",
  },
  {
    id: "bgm-loghouse-build",
    title: "モグラの大工さん工事中",
    description: "ログハウス建築のときのBGM",
    category: "bgm",
    src: "/audio/forest/music-hall/bgm_loghouse_build.mp3",
  },
];
