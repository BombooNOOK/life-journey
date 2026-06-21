/**
 * Verifies No.001-262 compact copy is applied (ID ↔ text).
 * Run: npx tsx scripts/verify-diary-reading-compact-copy.ts
 */
import { readFileSync } from "fs";
import { baseComments } from "../src/lib/diary-reading/baseComments";
import {
  calendarDayAccents,
  calendarMonthAccents,
  calendarMonthDayOverlapAccents,
  personalDayCalendarDayOverlapAccents,
  personalDayCalendarMonthOverlapAccents,
} from "../src/lib/diary-reading/calendarAccents";
import { generateDiaryReading } from "../src/lib/diary-reading/generateDiaryReading";

const manifest = JSON.parse(
  readFileSync("scripts/diary-reading-compact-copy-manifest.json", "utf8"),
);

const errors: string[] = [];

function expectEq(label: string, actual: string, expected: string) {
  if (actual !== expected) errors.push(`${label}: text mismatch`);
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

let no = 1;
for (const draftKey of baseOrder) {
  for (let pd = 1; pd <= 9; pd += 1) {
    const category =
      draftKey === "enjoyed"
        ? "favorite_fun"
        : draftKey === "emotional_wave"
          ? "heart_unsettled"
          : draftKey === "no_energy"
            ? "nothing_to_do"
            : draftKey === "down"
              ? "did_not_go_well"
              : draftKey === "record_anyway"
                ? "ordinary_record"
                : draftKey;
    const id = `${category}_${pd}_a`;
    const expected = manifest.base[draftKey][String(pd)];
    const found = baseComments.find((b) => b.id === id);
    if (!found) errors.push(`No.${String(no).padStart(3, "0")} missing id ${id}`);
    else expectEq(`No.${String(no).padStart(3, "0")} ${id}`, found.text, expected);
    no += 1;
  }
}

for (const t of calendarMonthAccents) {
  const m = /^calendar_month_(\d)_(\d)$/.exec(t.id);
  if (!m) continue;
  const expected = manifest.calendarMonth[m[1]][Number(m[2]) - 1];
  expectEq(t.id, t.text, expected);
}
for (const t of calendarDayAccents) {
  const m = /^calendar_day_(\d)_(\d)$/.exec(t.id);
  if (!m) continue;
  const expected = manifest.calendarDay[m[1]][Number(m[2]) - 1];
  expectEq(t.id, t.text, expected);
}
for (const t of personalDayCalendarMonthOverlapAccents) {
  const m = /^special_overlap_pm_(\d)_(\d)$/.exec(t.id);
  if (!m) continue;
  const expected = manifest.overlapPm[m[1]][Number(m[2]) - 1];
  expectEq(t.id, t.text, expected);
}
for (const t of personalDayCalendarDayOverlapAccents) {
  const m = /^special_overlap_pd_(\d)_(\d)$/.exec(t.id);
  if (!m) continue;
  const expected = manifest.overlapPd[m[1]][Number(m[2]) - 1];
  expectEq(t.id, t.text, expected);
}
for (const t of calendarMonthDayOverlapAccents) {
  const m = /^special_overlap_md_(\d)_(\d)$/.exec(t.id);
  if (!m) continue;
  const expected = manifest.overlapMd[m[1]][Number(m[2]) - 1];
  expectEq(t.id, t.text, expected);
}

const samples = [
  {
    label: "work_study PD3 + month accent",
    input: {
      actionCategory: "work_study" as const,
      mood: "calm",
      personalYear: 1,
      personalMonth: 3,
      personalDay: 3,
      calendarMonth: 3,
      calendarDay: 12,
    },
  },
  {
    label: "PM overlap PD7 month7",
    input: {
      actionCategory: "ordinary_record" as const,
      mood: "calm",
      personalYear: 1,
      personalMonth: 5,
      personalDay: 7,
      calendarMonth: 7,
      calendarDay: 14,
    },
  },
];

for (const s of samples) {
  const { text } = generateDiaryReading({ ...s.input, recentTemplateIds: [] });
  if (!text.includes("\n")) {
    errors.push(`${s.label}: expected base+accent with block separator`);
  }
  if (text.includes("今日は「")) {
    errors.push(`${s.label}: old base phrasing leaked`);
  }
}

if (errors.length) {
  console.error("VERIFY FAILED:\n" + errors.join("\n"));
  process.exit(1);
}
console.log("OK: 262 compact templates verified + sample generations");
