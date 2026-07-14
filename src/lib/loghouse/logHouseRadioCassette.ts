/**
 * ログハウス「森のラジカセ」UI先行モック用の仮データ・コピー・アセット。
 * 実音源再生・タイマー実処理・どんぐり連携は未実装。
 *
 * 将来の形（ハイブリッド／ローカル再生）:
 * - カセットごとに mp3（audioSrc）とジャケット画像（jacketSrc）をセットで保持
 * - 「いまのカセット」枠・所持カセット一覧の両方で同じジャケットを表示する
 */

import { buildForestMusicHallHref } from "@/lib/help/forestMusicHallNav";

export type LogHouseRadioRepeatMode = "off" | "one" | "all";

export type LogHouseRadioSleepTimerMinutes = "off" | 15 | 30 | 60;

/** カセットのざっくり分類（所持一覧・いまのカセット用） */
export type LogHouseRadioCassetteCategory = "bgm" | "nature";

export const LOG_HOUSE_RADIO_CATEGORY_LABEL: Record<LogHouseRadioCassetteCategory, string> = {
  bgm: "BGM",
  nature: "自然音",
};

export type LogHouseRadioCassette = {
  id: string;
  title: string;
  /** 一覧用の短い一言 */
  blurb: string;
  category: LogHouseRadioCassetteCategory;
  /**
   * カセットジャケット画像。
   * 「いまのカセット」右枠と、所持一覧の並びで同じものを出す想定。
   */
  jacketSrc?: string;
  /**
   * 音源（将来）。モック段階では未設定でよい。
   * 本実装では jacketSrc と対で保存する。
   */
  audioSrc?: string;
};

export const LOG_HOUSE_RADIO_ASSET_DIR = "/images/ljd/loghouse-room/radio" as const;

const LOG_HOUSE_RADIO_ASSET_VERSION = 3;

function radioAsset(filename: string): string {
  return `${LOG_HOUSE_RADIO_ASSET_DIR}/${filename}?v=${LOG_HOUSE_RADIO_ASSET_VERSION}`;
}

/** 木製操作パネル上の物理ボタン（水彩タッチPNG） */
export const LOG_HOUSE_RADIO_BUTTON_ASSETS = {
  playPause: radioAsset("radio_btn_play_pause.png"),
  stop: radioAsset("radio_btn_stop.png"),
  repeatOne: radioAsset("radio_btn_repeat_one.png"),
  repeatAll: radioAsset("radio_btn_repeat_all.png"),
  timer: radioAsset("radio_btn_timer.png"),
} as const;

export const LOG_HOUSE_RADIO_PANEL_WOOD_SRC = radioAsset("radio_panel_wood.png");

/** 木製パネル画像の実ピクセル比（天板・取っ手を切れないよう aspect 固定に使う） */
export const LOG_HOUSE_RADIO_PANEL_WOOD_INTRINSIC = {
  widthPx: 424,
  heightPx: 268,
} as const;

export const LOG_HOUSE_RADIO_CASSETTE_ICON_SRC = radioAsset("radio_cassette_icon.png");

/** 仮ジャケット（雨のログハウス）。専用ジャケットを渡したらこちらを差し替え */
export const LOG_HOUSE_RADIO_JACKET_RAIN_SRC = radioAsset("radio_cassette_jacket_rain.png");

/** お試し：モグラの大工さん工事中 */
export const LOG_HOUSE_RADIO_JACKET_LOGHOUSE_BUILD_SRC = radioAsset(
  "radio_cassette_jacket_loghouse_build.png",
);

export const LOG_HOUSE_RADIO_AUDIO_LOGHOUSE_BUILD_SRC =
  "/audio/forest/music-hall/bgm_loghouse_build.mp3" as const;

export const LOG_HOUSE_RADIO_EYEBROW = "ログハウスの道具" as const;

export const LOG_HOUSE_RADIO_TITLE = "森のラジカセ" as const;

export const LOG_HOUSE_RADIO_CLOSE_LABEL = "閉じる" as const;

export const LOG_HOUSE_RADIO_PREPARING_NOTE =
  "このラジカセはいま準備中です。「モグラの大工さん工事中」だけ、お試しで音が鳴ります。ほかのカセットはこれから。" as const;

export const LOG_HOUSE_RADIO_NOW_LABEL = "いまのカセット" as const;

export const LOG_HOUSE_RADIO_PLAYING_LABEL = "再生中" as const;

export const LOG_HOUSE_RADIO_PAUSED_LABEL = "一時停止" as const;

export const LOG_HOUSE_RADIO_STOPPED_LABEL = "停止中" as const;

export const LOG_HOUSE_RADIO_PLAY_PAUSE_LABEL = "再生／一時停止" as const;

export const LOG_HOUSE_RADIO_STOP_LABEL = "停止" as const;

export const LOG_HOUSE_RADIO_SWAP_LABEL = "カセットを入れ替える" as const;

export const LOG_HOUSE_RADIO_REPEAT_ONE_LABEL = "1曲リピート" as const;

export const LOG_HOUSE_RADIO_REPEAT_ALL_LABEL = "全曲リピート" as const;

export const LOG_HOUSE_RADIO_TIMER_BUTTON_LABEL = "タイマー" as const;

export const LOG_HOUSE_RADIO_SLEEP_TIMER_LABEL = "おやすみタイマー" as const;

export const LOG_HOUSE_RADIO_PICKER_TITLE = "カセットをえらぶ" as const;

export const LOG_HOUSE_RADIO_INSERT_LABEL = "このカセットを入れる" as const;

export const LOG_HOUSE_RADIO_CURRENT_BADGE = "いま入っている" as const;

export const LOG_HOUSE_RADIO_MUSIC_HALL_LINK_LABEL = "森の小さな音楽堂へ" as const;

export const LOG_HOUSE_RADIO_JACKET_FALLBACK_LABEL = "ジャケット準備中" as const;

export const LOG_HOUSE_RADIO_SLEEP_TIMER_OPTIONS: {
  value: LogHouseRadioSleepTimerMinutes;
  label: string;
}[] = [
  { value: 15, label: "15分" },
  { value: 30, label: "30分" },
  { value: 60, label: "60分" },
  { value: "off", label: "タイマーなし" },
];

/** 仮カセット一覧（本実装前の表示用）。先頭の1本はお試しで実音源＋ジャケットあり */
export const LOG_HOUSE_RADIO_CASSETTES: LogHouseRadioCassette[] = [
  {
    id: "loghouse-build",
    title: "モグラの大工さん工事中",
    blurb: "ログハウス建築のときのBGM",
    category: "bgm",
    jacketSrc: LOG_HOUSE_RADIO_JACKET_LOGHOUSE_BUILD_SRC,
    audioSrc: LOG_HOUSE_RADIO_AUDIO_LOGHOUSE_BUILD_SRC,
  },
  {
    id: "rain-loghouse",
    title: "雨のログハウス",
    blurb: "窓ガラスをたたく、やさしい雨音",
    category: "nature",
    jacketSrc: LOG_HOUSE_RADIO_JACKET_RAIN_SRC,
  },
  {
    id: "autumn-insects",
    title: "秋の虫の音",
    blurb: "草むらのこおろぎたちがそよそよ",
    category: "nature",
  },
  {
    id: "forest-morning",
    title: "森の朝",
    blurb: "葉ずれと、とおくの鳥の声",
    category: "nature",
  },
  {
    id: "river-murmur",
    title: "川のせせらぎ",
    blurb: "浅い川の、きらきらした流れ",
    category: "nature",
  },
  {
    id: "music-hall-vol1",
    title: "小さな音楽堂 Vol.1",
    blurb: "音楽堂で出会う曲のつめあわせ",
    category: "bgm",
  },
];

export const LOG_HOUSE_RADIO_DEFAULT_CASSETTE_ID = LOG_HOUSE_RADIO_CASSETTES[0]!.id;

export function findLogHouseRadioCassette(
  cassetteId: string,
): LogHouseRadioCassette {
  return (
    LOG_HOUSE_RADIO_CASSETTES.find((c) => c.id === cassetteId) ??
    LOG_HOUSE_RADIO_CASSETTES[0]!
  );
}

/** ラジカセからの音楽堂リンク（ログハウスへ戻れる） */
export function logHouseRadioMusicHallHref(): string {
  return buildForestMusicHallHref("/orders");
}

export function logHouseRadioPlaybackStatusLabel(params: {
  isPlaying: boolean;
  /** 再生を一度でも押したあと一時停止しているか（停止ボタンで解除） */
  isPaused: boolean;
}): string {
  if (params.isPlaying) return LOG_HOUSE_RADIO_PLAYING_LABEL;
  if (params.isPaused) return LOG_HOUSE_RADIO_PAUSED_LABEL;
  return LOG_HOUSE_RADIO_STOPPED_LABEL;
}

export function logHouseRadioRepeatStatusLabel(
  mode: LogHouseRadioRepeatMode,
): string | null {
  if (mode === "one") return "1曲リピート中";
  if (mode === "all") return "全曲リピート中";
  return null;
}

export function logHouseRadioSleepTimerStatusLabel(
  timer: LogHouseRadioSleepTimerMinutes,
): string | null {
  if (timer === "off") return null;
  return `${timer}分後に停止`;
}
