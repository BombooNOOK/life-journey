import type { DailyNumberGeneratedPayload, DailyNumberMessage } from "./types";
import { DAILY_NUMBER_SERIES_TITLE } from "./pageLayout";

function formatBlockCopy(block: DailyNumberMessage, label: string): string {
  const lines = [
    `【${label}】`,
    block.displayName,
    block.subtitle,
    block.body,
    `おまもりカラー：${block.colorName}`,
    "おすすめのすごしかた：",
    `・${block.actions[0]}`,
    `・${block.actions[1]}`,
  ];
  return lines.join("\n");
}

export function buildCanvaCopyText(payload: DailyNumberGeneratedPayload): string {
  const parts: string[] = [
    "【表紙】",
    `今日のすうじ：${payload.todayNumber}`,
    payload.cover.title,
    payload.cover.summaryMessage,
    `おまもりカラー：${payload.cover.colorName}`,
    "",
  ];

  for (const page of payload.pages) {
    page.blocks.forEach((block, blockIndex) => {
      const label =
        page.blocks.length === 2
          ? `すうじ${block.lifePathNumber}（ページ${page.pageIndex + 1}-${blockIndex + 1}）`
          : `すうじ${block.lifePathNumber}`;
      parts.push(formatBlockCopy(block, label));
      parts.push("");
    });
  }

  return parts.join("\n").trim();
}

export function buildInstagramCaption(payload: DailyNumberGeneratedPayload): string {
  const hashtags = [
    "#BambooNOOK",
    "#LifeJourneyDiary",
    "#今日のこころ予報",
    "#今日のすうじ",
    "#あなたのすうじ",
    "#数秘術",
    "#日記",
  ].join(" ");

  return [
    DAILY_NUMBER_SERIES_TITLE,
    "",
    `今日のすうじは「${payload.todayNumber}」`,
    payload.cover.title,
    payload.cover.summaryMessage,
    "",
    "今日のすうじは、日付から読む「今日全体の空気」。",
    "あなたのすうじは、生年月日から読む「あなたらしさ」。",
    "この2つを合わせて、今日のこころ予報として読んでいます。",
    "",
    "カルーセルでは、あなたのすうじごとのメッセージも載せています。",
    "自分のすうじのページを見て、今日をやさしく整えてみてください。",
    "",
    "Life Journey Diary では、日記を書く日に「今日のすうじ」もお伝えしています。",
    "今日の記録に残してみませんか。",
    "",
    hashtags,
  ].join("\n");
}
