/**
 * docs/diary-reading-base-templates-*.csv を現行ドラフトから再生成
 */
import { writeFileSync } from "fs";
import { baseComments } from "../src/lib/diary-reading/baseComments";

const actionLabels: Record<string, string> = {
  work_study: "work_study",
  family_friends: "family_friends",
  new_challenge: "new_challenge",
  rest: "rest",
  organize: "organize",
  favorite_fun: "favorite_fun（enjoyed）",
  outing: "outing",
  health_care: "health_care",
  very_happy: "very_happy",
  heart_unsettled: "heart_unsettled（emotional_wave）",
  hard_day: "hard_day",
  sad: "sad",
  anxious: "anxious",
  irritated: "irritated",
  lost_confidence: "lost_confidence",
  nothing_to_do: "nothing_to_do（no_energy）",
  did_not_go_well: "did_not_go_well（down）",
  ordinary_record: "ordinary_record（record_anyway）",
};

function csvEscape(s: string): string {
  if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

const header =
  "No.,テンプレートID,活動カテゴリ（DiaryActionCategory）,パーソナルデイ,現在の文言,変数,表示位置,備考";

const sorted = [...baseComments].sort((a, b) => {
  const cat = a.actionCategory.localeCompare(b.actionCategory);
  if (cat !== 0) return cat;
  return a.personalDay - b.personalDay;
});

const lines = [header];
sorted.forEach((t, i) => {
  const no = i + 1;
  lines.push(
    [
      String(no),
      t.id,
      actionLabels[t.actionCategory] ?? t.actionCategory,
      String(t.personalDay),
      t.text,
      "なし",
      "前半（ベース本文）",
      "generateDiaryReading のベース本文（末尾アクセントの前）",
    ]
      .map(csvEscape)
      .join(","),
  );
});

const full = `${lines.join("\n")}\n`;
writeFileSync("docs/diary-reading-base-templates-001-162.csv", full, "utf8");
writeFileSync(
  "docs/diary-reading-base-templates-part1-of-3.csv",
  `${[header, ...lines.slice(1, 55)].join("\n")}\n`,
  "utf8",
);
writeFileSync(
  "docs/diary-reading-base-templates-part2-of-3.csv",
  `${[header, ...lines.slice(55, 109)].join("\n")}\n`,
  "utf8",
);
writeFileSync(
  "docs/diary-reading-base-templates-part3-of-3.csv",
  `${[header, ...lines.slice(109)].join("\n")}\n`,
  "utf8",
);
console.log(`Wrote ${sorted.length} base ledger rows`);
