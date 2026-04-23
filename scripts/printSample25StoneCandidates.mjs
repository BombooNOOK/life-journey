#!/usr/bin/env node
/**
 * data/sample25-numerology.json の各コア（LP/D/S/P/BD）ナンバーに対し、
 * stonePdfV4.json の numerology 候補（色＝COLOR_BY_NUMBER）を一覧表示する。
 *
 * 使い方: node scripts/printSample25StoneCandidates.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");

const COLOR_BY_NUMBER = {
  1: "赤",
  2: "白",
  3: "黄",
  4: "緑",
  5: "青",
  6: "ピンク",
  7: "紺・藍",
  8: "橙・茶",
  9: "紫",
  11: "シルバー",
  22: "ゴールド",
  33: "虹",
};

const samplePath = path.join(root, "data/sample25-numerology.json");
const pdfPath = path.join(root, "data/stonePdfV4.json");

const sample = JSON.parse(fs.readFileSync(samplePath, "utf8"));
const pdf = JSON.parse(fs.readFileSync(pdfPath, "utf8"));

function candidatesForNumber(n) {
  const color = COLOR_BY_NUMBER[n];
  const rows = pdf.entries.filter(
    (e) => e.category === "numerology" && e.targetNumber === n,
  );
  return { color, rows };
}

const cores = [
  ["LP", sample.lifePathNumber],
  ["D", sample.destinyNumber],
  ["S", sample.soulNumber],
  ["P", sample.personalityNumber],
  ["BD", sample.birthdayNumber],
];

console.log(`=== ${sample.label ?? "sample"} 候補石（stonePdfV4.json / numerology のみ）===\n`);

for (const [label, num] of cores) {
  const { color, rows } = candidatesForNumber(num);
  console.log(`【${label}】ナンバー ${num} / 色「${color}」 — ${rows.length} 件`);
  for (const e of rows) {
    console.log(`  - ${e.stoneName} (${e.id})`);
  }
  console.log("");
}

function printNumberBlock(title, n) {
  const { color, rows } = candidatesForNumber(n);
  console.log(`--- ${title}（ナンバー ${n} / ${color}）---`);
  for (const e of rows) {
    console.log(`  ${e.stoneName}`);
  }
  console.log("");
}

console.log("=== 確認用（11 / 9 / 1）===\n");
printNumberBlock("11 のシルバー候補", 11);
printNumberBlock("9 の紫候補", 9);
printNumberBlock("1 の赤候補", 1);
