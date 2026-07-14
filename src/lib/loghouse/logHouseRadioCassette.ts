/**
 * ログハウス「森のラジカセ」UI先行モック用の仮データ・コピー。
 * 実音源再生・タイマー実処理・どんぐり連携は未実装。
 */

import { buildForestMusicHallHref } from "@/lib/help/forestMusicHallNav";

export type LogHouseRadioRepeatMode = "off" | "one" | "all";

export type LogHouseRadioSleepTimerMinutes = "off" | 15 | 30 | 60;

export type LogHouseRadioCassette = {
  id: string;
  title: string;
  /** 一覧用の短い一言 */
  blurb: string;
};

export const LOG_HOUSE_RADIO_TITLE = "森のラジカセ" as const;

export const LOG_HOUSE_RADIO_CLOSE_LABEL = "閉じる" as const;

export const LOG_HOUSE_RADIO_PREPARING_NOTE =
  "このラジカセはいま準備中です。操作の見た目だけお試しできます。音は、森の小さな音楽堂で準備が進んでいます。" as const;

export const LOG_HOUSE_RADIO_NOW_LABEL = "いまのカセット" as const;

export const LOG_HOUSE_RADIO_PLAYING_LABEL = "再生中" as const;

export const LOG_HOUSE_RADIO_STOPPED_LABEL = "停止中" as const;

export const LOG_HOUSE_RADIO_PLAY_LABEL = "再生" as const;

export const LOG_HOUSE_RADIO_STOP_LABEL = "停止" as const;

export const LOG_HOUSE_RADIO_SWAP_LABEL = "カセットを入れ替える" as const;

export const LOG_HOUSE_RADIO_REPEAT_ONE_LABEL = "1曲リピート" as const;

export const LOG_HOUSE_RADIO_REPEAT_ALL_LABEL = "全曲リピート" as const;

export const LOG_HOUSE_RADIO_SLEEP_TIMER_LABEL = "おやすみタイマー" as const;

export const LOG_HOUSE_RADIO_PICKER_TITLE = "カセットをえらぶ" as const;

export const LOG_HOUSE_RADIO_INSERT_LABEL = "このカセットを入れる" as const;

export const LOG_HOUSE_RADIO_CURRENT_BADGE = "いま入っている" as const;

export const LOG_HOUSE_RADIO_MUSIC_HALL_LINK_LABEL = "森の小さな音楽堂へ" as const;

export const LOG_HOUSE_RADIO_SLEEP_TIMER_OPTIONS: {
  value: LogHouseRadioSleepTimerMinutes;
  label: string;
}[] = [
  { value: 15, label: "15分" },
  { value: 30, label: "30分" },
  { value: 60, label: "60分" },
  { value: "off", label: "タイマーなし" },
];

/** 仮カセット一覧（本実装前の表示用） */
export const LOG_HOUSE_RADIO_CASSETTES: LogHouseRadioCassette[] = [
  {
    id: "rain-loghouse",
    title: "雨のログハウス",
    blurb: "窓ガラスをたたく、やさしい雨音",
  },
  {
    id: "autumn-insects",
    title: "秋の虫の音",
    blurb: "草むらのこおろぎたちがそよそよ",
  },
  {
    id: "forest-morning",
    title: "森の朝",
    blurb: "葉ずれと、とおくの鳥の声",
  },
  {
    id: "river-murmur",
    title: "川のせせらぎ",
    blurb: "浅い川の、きらきらした流れ",
  },
  {
    id: "music-hall-vol1",
    title: "小さな音楽堂 Vol.1",
    blurb: "音楽堂で出会う曲のつめあわせ",
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
