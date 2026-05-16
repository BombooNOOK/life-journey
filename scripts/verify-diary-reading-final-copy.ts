/**
 * Verifies No.001-262 final copy is applied (ID ↔ text).
 * Run: node scripts/verify-diary-reading-final-copy.mjs
 */
import { readFileSync } from "fs";
import { baseComments } from "../src/lib/diary-reading/baseComments.ts";
import {
  calendarDayAccents,
  calendarMonthAccents,
  calendarMonthDayOverlapAccents,
  personalDayCalendarDayOverlapAccents,
  personalDayCalendarMonthOverlapAccents,
} from "../src/lib/diary-reading/calendarAccents.ts";
import { generateDiaryReading } from "../src/lib/diary-reading/generateDiaryReading.ts";

const manifest = JSON.parse(
  readFileSync("scripts/diary-reading-final-copy-manifest.json", "utf8"),
);

const errors = [];

function expectEq(label, actual, expected) {
  if (actual !== expected) errors.push(`${label}: text mismatch`);
}

// Base 001-162 via manifest keys
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
const idToDraftKey = {
  favorite_fun: "enjoyed",
  heart_unsettled: "emotional_wave",
  nothing_to_do: "no_energy",
  did_not_go_well: "down",
  ordinary_record: "record_anyway",
};

let no = 1;
for (const draftKey of baseOrder) {
  for (let pd = 1; pd <= 9; pd += 1) {
    const category = draftKey === "enjoyed" ? "favorite_fun" : draftKey === "emotional_wave" ? "heart_unsettled" : draftKey === "no_energy" ? "nothing_to_do" : draftKey === "down" ? "did_not_go_well" : draftKey === "record_anyway" ? "ordinary_record" : draftKey;
    const id = `${category}_${pd}_a`;
    const expected = manifest.base[draftKey][String(pd)];
    const found = baseComments.find((b) => b.id === id);
    if (!found) errors.push(`No.${String(no).padStart(3, "0")} missing id ${id}`);
    else expectEq(`No.${String(no).padStart(3, "0")} ${id}`, found.text, expected);
    no += 1;
  }
}

// sad_9
const sad9 = baseComments.find((b) => b.id === "sad_9_a");
if (!sad9 || sad9.actionCategory !== "sad" || sad9.personalDay !== 9) {
  errors.push("No.108 sad_9_a mapping wrong");
}

// Accents 163-261
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

// Sample generations
const samples = [
  {
    label: "work_study PD3 short base + month",
    input: {
      actionCategory: "work_study",
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
      actionCategory: "ordinary_record",
      mood: "calm",
      personalYear: 1,
      personalMonth: 5,
      personalDay: 7,
      calendarMonth: 7,
      calendarDay: 14,
    },
  },
  {
    label: "MD overlap month5 day5",
    input: {
      actionCategory: "ordinary_record",
      mood: "calm",
      personalYear: 1,
      personalMonth: 5,
      personalDay: 7,
      calendarMonth: 5,
      calendarDay: 14,
    },
  },
];

for (const s of samples) {
  const { text } = generateDiaryReading({ ...s.input, recentTemplateIds: [] });
  if (!text.includes("\n\n")) {
    errors.push(`${s.label}: expected base+accent with blank line`);
  }
  if (text.includes("今日は「")) {
    errors.push(`${s.label}: old base phrasing leaked`);
  }
}

if (errors.length) {
  console.error("VERIFY FAILED:\n" + errors.join("\n"));
  process.exit(1);
}
console.log("OK: 262 templates verified + sample generations");
