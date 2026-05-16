/**
 * Applies scripts/diary-reading-final-copy-manifest.json to source files.
 * Run: node scripts/apply-diary-reading-final-copy.mjs
 */
import { readFileSync, writeFileSync } from "fs";

const manifest = JSON.parse(
  readFileSync("scripts/diary-reading-final-copy-manifest.json", "utf8"),
);

const draftPath = "src/lib/journal/commentPersonalDayActivityDraft.ts";
const accentPath = "src/lib/journal/commentCalendarAccentDraft.ts";
const readingPath = "src/lib/diary-reading/generateDiaryReading.ts";

function q(s) {
  return JSON.stringify(s);
}

function formatActivitySet(set) {
  const lines = [];
  for (let d = 1; d <= 9; d += 1) {
    lines.push(`    ${d}: ${q(set[String(d)])},`);
  }
  return lines.join("\n");
}

const baseOrder = [
  "work_study",
  "family_friends",
  "new_challenge",
  "rest",
  "organize",
  "enjoyed",
  "outing",
  "health_care",
  "very_happy",
  "emotional_wave",
  "hard_day",
  "sad",
  "anxious",
  "irritated",
  "lost_confidence",
  "no_energy",
  "down",
  "record_anyway",
];

const personalDraft = `export type PersonalDayNumber = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9;

export type ActivityCommentSet = Record<PersonalDayNumber, string>;

export const personalDayActivityDraft: Record<string, ActivityCommentSet> = {
${baseOrder
  .map((key) => `  ${key}: {\n${formatActivitySet(manifest.base[key])}\n  },`)
  .join("\n")}
};
`;

writeFileSync(draftPath, personalDraft, "utf8");

const monthThemes = {
  1: "始まり・切り替え・自分から動く",
  2: "調和・受け取る・人との距離感",
  3: "楽しさ・表現・言葉・軽やかさ",
  4: "整える・土台・慎重さ・形にする",
  5: "変化・風・移動・自由",
  6: "やさしさ・家族・人とのつながり・ケア",
  7: "内省・探求・静けさ・自分の世界",
  8: "成果・力・現実化・豊かさ",
  9: "区切り・手放し・整理・余韻",
};

const dayThemes = {
  1: "始まり・一歩・自分から動く",
  2: "調和・受け取る・関係性",
  3: "楽しさ・表現・言葉",
  4: "整える・土台・現実感",
  5: "変化・移動・新しい風",
  6: "やさしさ・ケア・つながり",
  7: "静けさ・探求・自分の内側",
  8: "力・成果・手ごたえ・現実化",
  9: "区切り・手放し・余白",
};

function formatDigitLines(record, themes) {
  return [1, 2, 3, 4, 5, 6, 7, 8, 9]
    .map((n) => {
      const lines = record[String(n)];
      const linesStr = lines.map((l) => `      ${q(l)},`).join("\n");
      return `  ${n}: {\n    theme: ${q(themes[n])},\n    lines: [\n${linesStr}\n    ],\n  },`;
    })
    .join("\n");
}

function formatOverlapByDigit(record) {
  return [1, 2, 3, 4, 5, 6, 7, 8, 9]
    .map((n) => {
      const pair = record[String(n)];
      return `    ${n}: [${q(pair[0])}, ${q(pair[1])}],`;
    })
    .join("\n");
}

const accentDraft = readFileSync(accentPath, "utf8");
const accentHead = accentDraft.split("export const calendarMonthAccentDraft")[0];

const accentTail = `export const calendarMonthAccentDraft: Record<SingleDigit, AccentDraft> = {
${formatDigitLines(manifest.calendarMonth, monthThemes)}
};

export const calendarDayAccentDraft: Record<SingleDigit, AccentDraft> = {
${formatDigitLines(manifest.calendarDay, dayThemes)}
};

export type OverlapLinesByDigit = Record<SingleDigit, [string, string]>;

export const specialAccentDraft = {
  personalDayEqualsCalendarMonth: {
${formatOverlapByDigit(manifest.overlapPm)}
  } satisfies OverlapLinesByDigit,
  personalDayEqualsCalendarDay: {
${formatOverlapByDigit(manifest.overlapPd)}
  } satisfies OverlapLinesByDigit,
  calendarMonthEqualsCalendarDay: {
${formatOverlapByDigit(manifest.overlapMd)}
  } satisfies OverlapLinesByDigit,
};

export const accentSelectionRuleDraft = {
  base: "コメント本体は actionCategory × personalDay から選ぶ",
  addMode: ["calendarMonthAccent", "calendarDayAccent", "none"] as const,
  priority: [
    "personalDay と calendarMonth が同じ数字 -> 月ニュアンス優先",
    "personalDay と calendarDay が同じ数字 -> 日ニュアンス優先",
    "月と日を両方入れるのは特別な時だけ",
  ],
  lengthControl: [
    "コメント全体が短い時 -> 月または日ニュアンスを追加",
    "すでに長い時 -> 追加しない",
  ],
  dedupe: "直近の使用テンプレートIDを見て重複回避",
};
`;

writeFileSync(accentPath, accentHead + accentTail, "utf8");

const readingSrc = readFileSync(readingPath, "utf8");
const updatedReading = readingSrc.replace(
  /text: "[^"]+",\n      usedTemplateIds: \[\],\n    };/,
  `text: ${q(manifest.fallback)},\n      usedTemplateIds: [],\n    };`,
);
writeFileSync(readingPath, updatedReading, "utf8");

console.log("Applied final copy to:");
console.log(" -", draftPath);
console.log(" -", accentPath);
console.log(" -", readingPath);
