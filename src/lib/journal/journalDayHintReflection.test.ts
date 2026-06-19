import { describe, expect, it } from "vitest";

import { getPersonalDayOneLineMessageByBirthDate } from "@/lib/numerology/personalDayMessage";

import {
  buildJournalDayHintReflection,
  formatJournalDayHintReflectionBody,
} from "./journalDayHintReflection";

describe("formatJournalDayHintReflectionBody", () => {
  it("引用文を振り返り用テンプレートに包む", () => {
    const body = formatJournalDayHintReflectionBody(
      "今日は、始まりの気持ちをまっすぐ大切にしたい日。",
    );
    expect(body).toContain("この日の数字から見ると、");
    expect(body).toContain("「今日は、始まりの気持ちをまっすぐ大切にしたい日。」");
    expect(body).toContain("というテーマがありました。");
    expect(body).toContain("あとから気づける小さなヒントがあるかもしれません。");
  });
});

describe("buildJournalDayHintReflection", () => {
  it("記録日と orderId から今日のヒントと同じ一行を選ぶ", () => {
    const entryDate = new Date(Date.UTC(2026, 3, 16, 12, 0, 0));
    const orderId = "order-test-001";
    const birthMonth = 6;
    const birthDay = 6;

    const reflection = buildJournalDayHintReflection({
      birthMonth,
      birthDay,
      entryDate,
      orderId,
    });

    const todayHintLine = getPersonalDayOneLineMessageByBirthDate({
      birthMonth,
      birthDay,
      date: entryDate,
      userSeed: orderId,
    });

    expect(reflection.oneLineMessage).toBe(todayHintLine.message);
    expect(reflection.personalMonth).toBe(todayHintLine.personalMonthNumber);
    expect(reflection.personalDay).toBe(todayHintLine.personalDayNumber);
    expect(reflection.body).toContain(`「${todayHintLine.message}」`);
  });
});
