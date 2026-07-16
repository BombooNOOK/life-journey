import { japanTodayAnchorDate } from "@/lib/date/japanCalendarDate";
import { getPersonalDayOneLineMessageByBirthDate } from "@/lib/numerology/personalDayMessage";
import {
  personalDayNumber,
  personalMonthNumber,
  personalYearNumber,
} from "@/lib/numerology/personalYearMonth";

export const GUARDIAN_COLORS = [
  "赤",
  "オレンジ・茶",
  "黄",
  "緑",
  "青",
  "紺・藍色",
  "紫",
  "ピンク",
  "ゴールド",
] as const;

export const SMALL_ACTION_HINTS = [
  "新しい一歩を小さく始める",
  "誰かにやさしい言葉をかける",
  "楽しいことを10分だけでもやる",
  "身の回りをひとつ整える",
  "少し冒険して、いつもと違う選択をする",
  "身近な人をサポートする",
  "静かな時間を作って振り返る",
  "やるべきことを一つ完了させる",
  "手放したいことをひとつ決める",
] as const;

export type TodayHintInput = {
  orderId: string;
  birthMonth: number;
  birthDay: number;
  date?: Date;
};

export type TodayHintContent = {
  message: string;
  guardianColor: string;
  smallAction: string;
  personalYear: number;
  personalMonth: number;
  personalDay: number;
};

/** 鑑定ページ用：今日のヒント本文と数字ガイド */
export function buildTodayHintContent({
  orderId,
  birthMonth,
  birthDay,
  date = japanTodayAnchorDate(),
}: TodayHintInput): TodayHintContent {
  const personalYear = personalYearNumber(birthMonth, birthDay, date.getFullYear());
  const personalMonth = personalMonthNumber(personalYear, date.getMonth() + 1);
  const personalDay = personalDayNumber(personalMonth, date.getDate());
  const dayMessage = getPersonalDayOneLineMessageByBirthDate({
    birthMonth,
    birthDay,
    date,
    userSeed: orderId,
  });
  const index = (personalDay - 1 + GUARDIAN_COLORS.length) % GUARDIAN_COLORS.length;

  return {
    message: dayMessage.message,
    guardianColor: GUARDIAN_COLORS[index] ?? GUARDIAN_COLORS[0],
    smallAction: SMALL_ACTION_HINTS[index] ?? SMALL_ACTION_HINTS[0],
    personalYear,
    personalMonth,
    personalDay,
  };
}
