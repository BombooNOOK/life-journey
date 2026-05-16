/**
 * docs/diary-reading-accent-templates-*.csv を生成する（文言確認用台帳）。
 * 実行: npx tsx scripts/generate-diary-accent-ledger.ts
 */
import { writeFileSync } from "fs";

import {
  calendarDayAccents,
  calendarMonthAccents,
  calendarMonthDayOverlapAccents,
  personalDayCalendarDayOverlapAccents,
  personalDayCalendarMonthOverlapAccents,
} from "../src/lib/diary-reading/calendarAccents";
import {
  calendarDayAccentDraft,
  calendarMonthAccentDraft,
  type SingleDigit,
} from "../src/lib/journal/commentCalendarAccentDraft";

const FALLBACK =
  "今日の記録には、あなたにしか分からない小さな意味があります。書き残したことそのものが、明日の自分への手紙になります。";

type Row = {
  id: string;
  category: string;
  condition: string;
  text: string;
  vars: string;
  position: string;
  note: string;
};

const rows: Row[] = [];

for (const t of calendarMonthAccents) {
  const theme = calendarMonthAccentDraft[t.number as SingleDigit].theme;
  rows.push({
    id: t.id,
    category: "暦の月アクセント",
    condition: `ベース本文の文字数 < 120。重なりアクセントが未適用のとき。暦の月を桁おろしした数字 = ${t.number}（calendarMonth 1→1 … 10→1, 11→2, 12→3）`,
    text: t.text,
    vars: "なし",
    position: "末尾アクセント（ベース本文の後、空行1行で連結）",
    note: `type=calendar_month。テーマ: ${theme}`,
  });
}

for (const t of calendarDayAccents) {
  const theme = calendarDayAccentDraft[t.number as SingleDigit].theme;
  rows.push({
    id: t.id,
    category: "暦の日アクセント",
    condition: `ベース本文の文字数 < 160。重なり・月アクセント未適用（月は base<120 のときのみ試行）。暦の日を桁おろしした数字 = ${t.number}`,
    text: t.text,
    vars: "なし",
    position: "末尾アクセント（ベース本文の後、空行1行で連結）",
    note: `type=calendar_day。テーマ: ${theme}`,
  });
}

for (const t of personalDayCalendarMonthOverlapAccents) {
  rows.push({
    id: t.id,
    category: "パーソナルデイ×暦の月 重なり",
    condition: `personalDay === reduceToSingleDigit(calendarMonth) かつ数字 = ${t.number}。pickAccent 最優先（seed+17）。PD=月=日の三重一致時もこの候補プールのみ`,
    text: t.text,
    vars: "なし",
    position: "末尾アクセント",
    note: "overlapSource=personal_month。ID接頭辞 special_overlap_pm_",
  });
}

for (const t of personalDayCalendarDayOverlapAccents) {
  rows.push({
    id: t.id,
    category: "パーソナルデイ×暦の日 重なり",
    condition: `personalDay === reduceToSingleDigit(calendarDay) かつ数字 = ${t.number}。pickAccent 最優先（seed+17）。PD=月=日のときは月重なり候補とプール合成`,
    text: t.text,
    vars: "なし",
    position: "末尾アクセント",
    note: "overlapSource=personal_day。ID接頭辞 special_overlap_pd_",
  });
}

for (const t of calendarMonthDayOverlapAccents) {
  rows.push({
    id: t.id,
    category: "暦の月×暦の日 重なり",
    condition: `reduceToSingleDigit(calendarMonth) === reduceToSingleDigit(calendarDay) = ${t.number}。PD重なりブロックを通過後（seed+19）。PD=月またはPD=日のときは通常出ない`,
    text: t.text,
    vars: "なし",
    position: "末尾アクセント",
    note: "overlapSource=calendar_md。ID接頭辞 special_overlap_md_",
  });
}

rows.push({
  id: "fallback_no_base_match",
  category: "フォールバック（ベース未一致）",
  condition:
    "actionCategory × personalDay に一致する baseComments が無いとき。末尾アクセントは付かない",
  text: FALLBACK,
  vars: "なし",
  position: "全文単独（ベース・アクセントの区別なし）",
  note: "generateDiaryReading.ts 直書き。usedTemplateIds=[]",
});

function csvEscape(s: string): string {
  if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

const header =
  "No.,テンプレートID,カテゴリ,出力条件,現在の文言,使っている変数,表示位置,備考";
const startNo = 163;
const lines = [header];
for (let i = 0; i < rows.length; i += 1) {
  const r = rows[i]!;
  lines.push(
    [String(startNo + i), r.id, r.category, r.condition, r.text, r.vars, r.position, r.note]
      .map(csvEscape)
      .join(","),
  );
}

const full = `${lines.join("\n")}\n`;
writeFileSync("docs/diary-reading-accent-templates-163-262.csv", full, "utf8");
writeFileSync(
  "docs/diary-reading-accent-templates-part1-of-3.csv",
  `${[header, ...lines.slice(1, 28)].join("\n")}\n`,
  "utf8",
);
writeFileSync(
  "docs/diary-reading-accent-templates-part2-of-3.csv",
  `${[header, ...lines.slice(28, 82)].join("\n")}\n`,
  "utf8",
);
writeFileSync(
  "docs/diary-reading-accent-templates-part3-of-3.csv",
  `${[header, ...lines.slice(82)].join("\n")}\n`,
  "utf8",
);

console.log(`Wrote ${rows.length} accent ledger rows (No.${startNo}–${startNo + rows.length - 1})`);
