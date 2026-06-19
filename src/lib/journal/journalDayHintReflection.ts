import { getPersonalDayOneLineMessage } from "@/lib/numerology/personalDayMessage";
import {
  personalDayNumber,
  personalMonthNumber,
  personalYearNumber,
} from "@/lib/numerology/personalYearMonth";

import { journalReferenceUtcYMD } from "./referenceDateParts";

export type JournalDayHintReflection = {
  /** 日記プレビュー用の振り返り本文（見出し除く） */
  body: string;
  /** personalDayMonthLines から選ばれた一行（引用元） */
  oneLineMessage: string;
  personalMonth: number;
  personalDay: number;
};

/** 日記プレビュー向け：今日のひとこと引用＋振り返り文 */
export function formatJournalDayHintReflectionBody(oneLineMessage: string): string {
  return `この日の数字から見ると、

「${oneLineMessage}」

というテーマがありました。

書き残したことの中に、
あとから気づける小さなヒントがあるかもしれません。`;
}

/**
 * 日記の記録日（`createdAt` UTC 正午）を基準に、今日のヒントと同じ正本から振り返り文を組み立てる。
 * seed は鑑定 Order ID（今日のヒントページと同じ）。
 */
export function buildJournalDayHintReflection(params: {
  birthMonth: number;
  birthDay: number;
  entryDate: Date;
  orderId: string;
}): JournalDayHintReflection {
  const { year, month, day } = journalReferenceUtcYMD(params.entryDate);
  const anchor = new Date(Date.UTC(year, month - 1, day, 12, 0, 0));
  const personalYear = personalYearNumber(params.birthMonth, params.birthDay, year);
  const personalMonth = personalMonthNumber(personalYear, month);
  const personalDay = personalDayNumber(personalMonth, day);

  const line = getPersonalDayOneLineMessage({
    personalMonthNumber: personalMonth,
    personalDayNumber: personalDay,
    date: anchor,
    userSeed: params.orderId,
  });

  return {
    body: formatJournalDayHintReflectionBody(line.message),
    oneLineMessage: line.message,
    personalMonth,
    personalDay,
  };
}
