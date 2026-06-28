/**
 * チャット貼り付け原稿 → docs/daily-number-messages-owl-summer.csv
 *
 *   node scripts/parse-daily-number-summer-paste.mjs docs/daily-number-summer-paste.txt
 */
import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

const inputPath = process.argv[2];
if (!inputPath) {
  console.error("Usage: node scripts/parse-daily-number-summer-paste.mjs <paste.txt>");
  process.exit(1);
}

const raw = readFileSync(inputPath, "utf8").replace(/\r/g, "");
const LIFE_PATHS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 11, 22, 33];

function parseLifePath(headerLine) {
  const m = headerLine.match(/すうじ(\d+)のあなたへ/);
  if (!m) throw new Error(`LP header not found: ${headerLine}`);
  return Number(m[1]);
}

function parseColor(line) {
  const m = line.match(/おまもりカラー[：:]\s*(.+)/);
  if (!m) throw new Error(`color not found: ${line}`);
  return m[1].trim();
}

function csvEscape(value) {
  return `"${value.replace(/"/g, '""')}"`;
}

const rows = [];
const udBlocks = raw.split(/(?=UD\d+[：:])/g).filter((b) => /^UD\d+/i.test(b.trim()));

for (const block of udBlocks) {
  const udMatch = block.match(/^UD(\d+)[：:]/);
  if (!udMatch) continue;
  const todayNumber = Number(udMatch[1]);
  if (todayNumber < 1 || todayNumber > 9) {
    throw new Error(`Invalid UD: ${todayNumber}`);
  }

  const sections = block.split(/(?=すうじ\d+のあなたへ)/g).slice(1);
  if (sections.length !== 12) {
    throw new Error(`UD${todayNumber}: expected 12 LP blocks, got ${sections.length}`);
  }

  for (const section of sections) {
    const lines = section
      .split("\n")
      .map((l) => l.trim())
      .filter(Boolean);
    const lifePathNumber = parseLifePath(lines[0]);
    if (!LIFE_PATHS.includes(lifePathNumber)) {
      throw new Error(`Invalid LP ${lifePathNumber} in UD${todayNumber}`);
    }

    const subtitleIdx = lines.findIndex((l) => l.endsWith("のすうじ"));
    const colorIdx = lines.findIndex((l) => l.startsWith("おまもりカラー"));
    const actionIdx = lines.findIndex((l) => l.startsWith("おすすめのすごしかた"));
    if (subtitleIdx < 0 || colorIdx < 2 || actionIdx < colorIdx) {
      throw new Error(`Malformed section UD${todayNumber} LP${lifePathNumber}`);
    }

    const bodyLines = lines.slice(subtitleIdx + 1, colorIdx);
    if (bodyLines.length < 2) {
      throw new Error(`Body too short UD${todayNumber} LP${lifePathNumber}`);
    }
    const body = bodyLines.join("");
    const colorName = parseColor(lines[colorIdx]);
    const action1 = lines[actionIdx + 1]?.replace(/^・/, "").trim() ?? "";
    const action2 = lines[actionIdx + 2]?.replace(/^・/, "").trim() ?? "";
    if (!action1 || !action2) {
      throw new Error(`Actions missing UD${todayNumber} LP${lifePathNumber}`);
    }

    rows.push({
      todayNumber,
      lifePathNumber,
      body,
      colorName,
      action1,
      action2,
      notes: `UD${todayNumber}×LP${lifePathNumber}×owl summer A`,
    });
  }
}

if (rows.length !== 108) {
  throw new Error(`Expected 108 rows, got ${rows.length}`);
}

rows.sort((a, b) => {
  if (a.todayNumber !== b.todayNumber) return a.todayNumber - b.todayNumber;
  return LIFE_PATHS.indexOf(a.lifePathNumber) - LIFE_PATHS.indexOf(b.lifePathNumber);
});

const header =
  "todayNumber,lifePathNumber,character,messageType,variant,season,colorName,body,action1,action2,notes";
const body = [
  header,
  ...rows.map((r) =>
    [
      r.todayNumber,
      r.lifePathNumber,
      "owl",
      "base",
      "A",
      "summer",
      csvEscape(r.colorName),
      csvEscape(r.body),
      csvEscape(r.action1),
      csvEscape(r.action2),
      csvEscape(r.notes),
    ].join(","),
  ),
].join("\n");

const outPath = path.join(process.cwd(), "docs/daily-number-messages-owl-summer.csv");
writeFileSync(outPath, `${body}\n`, "utf8");
console.log(`Wrote ${rows.length} rows to ${outPath}`);
