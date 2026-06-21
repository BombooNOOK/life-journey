/**
 * Build scripts/diary-reading-compact-copy-manifest.json from compact paste files.
 * Run: node scripts/ingest-diary-compact-copy.mjs
 */
import { readFileSync, writeFileSync } from "fs";

const DRAFT_KEY_BY_ACTION = {
  work_study: "work_study",
  family_friends: "family_friends",
  new_challenge: "new_challenge",
  rest: "rest",
  organize: "organize",
  favorite_fun: "enjoyed",
  outing: "outing",
  health_care: "health_care",
  very_happy: "very_happy",
  heart_unsettled: "emotional_wave",
  hard_day: "hard_day",
  sad: "sad",
  anxious: "anxious",
  irritated: "irritated",
  lost_confidence: "lost_confidence",
  nothing_to_do: "no_energy",
  did_not_go_well: "down",
  ordinary_record: "record_anyway",
};

function parseBase(text) {
  const base = {};
  const re = /^No\.\d+\s*\|\s*[\w_]+\s*\|\s*([\w_]+)\s*\|\s*(\d)\s*(.+)$/;
  for (const line of text.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed.startsWith("No.")) continue;
    const m = re.exec(trimmed);
    if (!m) throw new Error(`Base parse failed: ${trimmed.slice(0, 80)}`);
    const draftKey = DRAFT_KEY_BY_ACTION[m[1]];
    if (!draftKey) throw new Error(`Unknown action: ${m[1]}`);
    base[draftKey] ??= {};
    base[draftKey][m[2]] = m[3].trim();
  }
  const count = Object.values(base).reduce((n, v) => n + Object.keys(v).length, 0);
  if (count !== 162) throw new Error(`Expected 162 base entries, got ${count}`);
  return base;
}

function parseAccentLines(text) {
  const re = /^No\.\d+\s*\|\s*([\w_]+)\s+(.+)$/;
  const entries = [];
  for (const line of text.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed.startsWith("No.")) continue;
    const m = re.exec(trimmed);
    if (!m) throw new Error(`Accent parse failed: ${trimmed.slice(0, 80)}`);
    entries.push({ id: m[1], text: m[2].trim() });
  }
  return entries;
}

function bucketAccents(entries) {
  const calendarMonth = Object.fromEntries(
    [1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => [String(n), []]),
  );
  const calendarDay = Object.fromEntries(
    [1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => [String(n), []]),
  );
  const overlapPm = Object.fromEntries(
    [1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => [String(n), []]),
  );
  const overlapPd = Object.fromEntries(
    [1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => [String(n), []]),
  );
  const overlapMd = Object.fromEntries(
    [1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => [String(n), []]),
  );
  let fallback = "";

  for (const { id, text } of entries) {
    if (id === "fallback_no_base_match") {
      fallback = text;
      continue;
    }
    let m;
    if ((m = /^calendar_month_(\d)_(\d)$/.exec(id))) {
      calendarMonth[m[1]][Number(m[2]) - 1] = text;
      continue;
    }
    if ((m = /^calendar_day_(\d)_(\d)$/.exec(id))) {
      calendarDay[m[1]][Number(m[2]) - 1] = text;
      continue;
    }
    if ((m = /^special_overlap_pm_(\d)_(\d)$/.exec(id))) {
      overlapPm[m[1]][Number(m[2]) - 1] = text;
      continue;
    }
    if ((m = /^special_overlap_pd_(\d)_(\d)$/.exec(id))) {
      overlapPd[m[1]][Number(m[2]) - 1] = text;
      continue;
    }
    if ((m = /^special_overlap_md_(\d)_(\d)$/.exec(id))) {
      overlapMd[m[1]][Number(m[2]) - 1] = text;
      continue;
    }
    throw new Error(`Unknown accent id: ${id}`);
  }

  for (const [name, bucket] of [
    ["calendarMonth", calendarMonth],
    ["calendarDay", calendarDay],
    ["overlapPm", overlapPm],
    ["overlapPd", overlapPd],
    ["overlapMd", overlapMd],
  ]) {
    for (const digit of Object.keys(bucket)) {
      if (bucket[digit].some((t) => !t)) {
        throw new Error(`Missing ${name}[${digit}] lines`);
      }
    }
  }

  if (!fallback) throw new Error("Missing fallback");

  return { calendarMonth, calendarDay, overlapPm, overlapPd, overlapMd, fallback };
}

const baseText = readFileSync("docs/diary-reading-compact-base.paste.txt", "utf8");
const accentText = readFileSync("docs/diary-reading-compact-accent.paste.txt", "utf8");

const accentEntries = parseAccentLines(accentText);
if (accentEntries.length !== 100) {
  throw new Error(`Expected 100 accent/fallback lines, got ${accentEntries.length}`);
}

const manifest = {
  base: parseBase(baseText),
  ...bucketAccents(accentEntries),
};

writeFileSync(
  "scripts/diary-reading-compact-copy-manifest.json",
  `${JSON.stringify(manifest, null, 2)}\n`,
  "utf8",
);

console.log("Wrote scripts/diary-reading-compact-copy-manifest.json");
