/**
 * scripts/stonePdfV4-raw.txt（pdf-parse で抽出）を読み、構造化 JSON を出力する。
 */
import fs from "node:fs";
import path from "node:path";

const inPath = path.join(process.cwd(), process.argv[2] ?? "scripts/stonePdfV4-raw.txt");

let raw = fs.readFileSync(inPath, "utf8");
raw = raw.replace(/\r\n/g, "\n").replace(/^\uFEFF/, "");

function stripNoise(s) {
  return s.replace(/\u0000/g, "").replace(/\u00ad/g, "");
}

function normalizeJa(s) {
  return stripNoise(s)
    .normalize("NFKC")
    .replaceAll("⽯", "石")
    .replaceAll("⼒", "力")
    .replaceAll("⼈", "人")
    .replaceAll("⾯", "面")
    .replaceAll("⾒", "見")
    .replaceAll("⾎", "血")
    .replaceAll("⾃", "自")
    .replaceAll("⾊", "色")
    .replaceAll("⽣", "生")
    .replaceAll("⽉", "月")
    .replaceAll("⽇", "日")
    .replaceAll("⾝", "身")
    .replaceAll("⾏", "行")
    .replaceAll("⾼", "高")
    .replaceAll("⼤", "大")
    .replaceAll("⼩", "小")
    .replaceAll("⼥", "女")
    .replaceAll("⼦", "子")
    .replaceAll("⽬", "目")
    .replaceAll("⽔", "水")
    .replaceAll("⾦", "金")
    .replaceAll("⼼", "心")
    .replaceAll("⼿", "手")
    .replaceAll("⾜", "足")
    .replaceAll("⻑", "長")
    .replaceAll("⻘", "青")
    .replaceAll("⻁", "虎")
    .replaceAll("⺟", "母")
    .replaceAll("⿊", "黑")
    .trim();
}

function preprocess(text) {
  return text
    .replace(/([0-9]+)ナンバー/g, "$1\nナンバー")
    .replace(/数秘石のキーワード/g, "数秘\n石のキーワード");
}

function slugifyJa(name) {
  const base = name
    .replace(/[（）\s]/g, "")
    .replace(/・/g, "-")
    .replace(/[^\p{Letter}\p{Number}]+/gu, "-")
    .replace(/^-+|-+$/g, "")
    .toLowerCase();
  return base || "stone";
}

function extractFeaturePower(blockLines) {
  const text = blockLines.join("\n");
  const fm = /\*[\s\n]*石の特徴/.exec(text);
  if (!fm) return { featureText: "", powerText: "" };
  const afterFeatureIdx = fm.index + fm[0].length;
  const tail = text.slice(afterFeatureIdx);
  const pm = /\*[\s\n]*石のパワー/.exec(tail);
  if (!pm) return { featureText: normalizeJa(tail.trim()), powerText: "" };
  return {
    featureText: normalizeJa(tail.slice(0, pm.index).trim()),
    powerText: normalizeJa(tail.slice(pm.index + pm[0].length).trim()),
  };
}

/** @param {string[]} lines @param {number} i */
function skipNumberLines(lines, i) {
  while (i < lines.length && /^[0-9]+$/.test(lines[i].trim())) i += 1;
  return i;
}

function parseNumerologyBlock(lines) {
  let i = 0;
  i = skipNumberLines(lines, i);
  if (lines[i] !== "ナンバー") return null;
  i += 1;
  i = skipNumberLines(lines, i);

  let stoneName = "";

  // 翡翠ページ: ナンバー → 数秘 → 石のキーワード → 石名行
  if (lines[i] === "数秘") {
    i += 1;
    if (lines[i] === "石のキーワード") {
      i += 1;
      if (lines[i] && !lines[i].startsWith("・")) {
        stoneName = lines[i].trim();
        i += 1;
      }
    }
  } else {
    stoneName = (lines[i] ?? "").trim();
    i += 1;
  }

  const headlineKeywords = [];
  while (lines[i]?.startsWith("・")) {
    headlineKeywords.push(lines[i].replace(/^・/, "").trim());
    i += 1;
  }

  const taglineParts = [];
  while (
    i < lines.length &&
    lines[i] !== "数秘" &&
    lines[i] !== "石のキーワード" &&
    !/^\*[\s]*石の特徴/.test(lines[i] ?? "") &&
    lines[i] !== "*"
  ) {
    if (lines[i] !== "") taglineParts.push(lines[i]);
    i += 1;
  }

  let tagline = taglineParts.join("\n").trim();

  if (lines[i] === "数秘") {
    i += 1;
    const tp = [];
    while (i < lines.length && lines[i] !== "石のキーワード" && !/^\*[\s]*石の特徴/.test(lines[i] ?? "")) {
      if (lines[i] !== "") tp.push(lines[i]);
      i += 1;
    }
    if (tp.length) tagline = tp.join("\n").trim();
  }

  let numerologyKeywords = [];
  if (lines[i] === "石のキーワード") {
    i += 1;
    while (i < lines.length) {
      const line = lines[i];
      if (/^\*[\s]*石の特徴/.test(line) || line === "*") break;
      if (line.startsWith("・")) numerologyKeywords.push(line.replace(/^・/, "").trim());
      else if (/^[0-9]+\s+・/.test(line)) numerologyKeywords.push(line.replace(/^[0-9]+\s+/, "").replace(/^・/, "").trim());
      else if (/^[0-9]+$/.test(line.trim())) {
        /* page number noise */
      } else if (!line.startsWith("・") && numerologyKeywords.length > 0) break;
      else if (!line.startsWith("・") && line.includes("（") && stoneName.includes("翡翠")) {
        /* */
      }
      i += 1;
      if (/^\*[\s]*石の特徴/.test(lines[i] ?? "") || lines[i] === "*") break;
    }
  }

  // タグラインのあとに続く単独行の番号（例: ロードナイトの後の 1）をスキップ
  i = skipNumberLines(lines, i);

  const rest = lines.slice(i);
  const { featureText, powerText } = extractFeaturePower(rest);

  const nums = [];
  for (const l of lines) {
    const m = /^([0-9]+)\s*$/.exec(l.trim());
    if (m) nums.push(Number(m[1]));
  }
  const preferred = [1, 2, 3, 4, 5, 6, 7, 8, 9, 11, 22, 33];
  const targetNumber = nums.find((n) => preferred.includes(n)) ?? nums[0] ?? null;

  return {
    stoneName: normalizeJa(stoneName),
    targetNumber,
    category: "numerology",
    sectionLabel: null,
    headlineKeywords: headlineKeywords.map(normalizeJa),
    tagline: normalizeJa(tagline),
    numerologyKeywords: [...new Set(numerologyKeywords.map(normalizeJa))].filter(Boolean),
    featureText,
    powerText,
  };
}

function parseBaseBlock(lines) {
  let i = 0;
  if (lines[i] !== "ベースの石") return null;
  i += 1;

  let stoneName = "";

  if (lines[i] === "数秘") {
    i += 1;
    if (lines[i] === "石のキーワード") i += 1;
    while (lines[i]?.startsWith("・")) i += 1;
    while (i < lines.length && (lines[i] === "" || (lines[i] ?? "").trim() === "")) i += 1;
    while (i < lines.length && /^[0-9]+$/.test((lines[i] ?? "").trim())) i += 1;
    while (i < lines.length && (lines[i] === "" || (lines[i] ?? "").trim() === "")) i += 1;
    stoneName = (lines[i] ?? "").trim();
    i += 1;
  } else {
    stoneName = (lines[i] ?? "").trim();
    i += 1;
  }

  const headlineKeywords = [];
  while (lines[i]?.startsWith("・")) {
    headlineKeywords.push(lines[i].replace(/^・/, "").trim());
    i += 1;
  }

  const taglineParts = [];
  while (i < lines.length && lines[i] !== "数秘" && lines[i] !== "石のキーワード" && !/^\*[\s]*石の特徴/.test(lines[i] ?? "") && lines[i] !== "*") {
    if (lines[i] !== "") taglineParts.push(lines[i]);
    i += 1;
  }

  let tagline = taglineParts.join("\n").trim();

  if (lines[i] === "数秘") {
    i += 1;
    if (lines[i] === "石のキーワード") i += 1;
    const nk = [];
    while (lines[i]?.startsWith("・")) {
      nk.push(lines[i].replace(/^・/, "").trim());
      i += 1;
    }
    const tp = [];
    while (i < lines.length && !/^\*[\s]*石の特徴/.test(lines[i] ?? "") && lines[i] !== "*") {
      if (lines[i] !== "") tp.push(lines[i]);
      i += 1;
    }
    if (tp.length) tagline = tp.join("\n").trim();
  }

  const rest = lines.slice(i);
  const { featureText, powerText } = extractFeaturePower(rest);

  return {
    stoneName: normalizeJa(stoneName),
    targetNumber: null,
    category: "base",
    sectionLabel: "ベースの石",
    headlineKeywords: headlineKeywords.map(normalizeJa),
    tagline: normalizeJa(tagline),
    numerologyKeywords: [],
    featureText,
    powerText,
  };
}

function parseDharmaEyeBlock(lines) {
  if (lines[0] !== "天眼石") return null;
  const rest = lines.slice(1);
  const { featureText, powerText } = extractFeaturePower(rest);
  return {
    stoneName: "天眼石（アイアゲート）",
    targetNumber: null,
    category: "dharmaEye",
    sectionLabel: "天眼石",
    headlineKeywords: [],
    tagline: "",
    numerologyKeywords: [],
    featureText,
    powerText,
  };
}

/** 「1」+ *石の特徴 で始まるベース石の続きページ */
function parseNumberedFeatureTail(lines) {
  const full = lines.join("\n");
  const { featureText, powerText } = extractFeaturePower(lines);
  let stoneName = "";
  for (const line of lines) {
    const m = /(ブラックトルマリン|スモーキークォーツ|ヘマタイト)(（[^）]+）)/.exec(line);
    if (m) {
      stoneName = `${m[1]}${m[2]}`;
      break;
    }
  }
  if (!stoneName) return null;
  const hk = [];
  for (const line of lines) {
    if (line.startsWith("・") && !/（[0-9]+面カット）/.test(line)) hk.push(line.replace(/^・/, "").trim());
  }
  const tagLine =
    lines.find((l) => /安定感を与える|反射作用で|大地からの波動/.test(l) && !l.startsWith("・") && !l.includes("（")) ??
    "";
  return {
    stoneName: normalizeJa(stoneName),
    targetNumber: null,
    category: "base",
    sectionLabel: "ベースの石",
    headlineKeywords: hk.map(normalizeJa).filter(Boolean),
    tagline: normalizeJa(tagLine),
    numerologyKeywords: [],
    featureText,
    powerText,
  };
}

const pre = preprocess(raw);
const chunks = pre.split(
  /(?=\n(?:(?:[0-9]+\n)+)?(?:ナンバー|ベースの石|天眼石)\n)|(?=\n[0-9]+\n\*[\s]*石の特徴\n)|(?=\n[0-9]+\n\*\n\*[\s]*石の特徴\n)/,
);

const entries = [];
let seq = 0;

for (const chunk of chunks) {
  const t = chunk.trim();
  if (!t) continue;
  const lines = t.split("\n").map((l) => l.trimEnd());

  let parsed = null;
  const first = lines[0].trim();
  if (first === "天眼石") parsed = parseDharmaEyeBlock(lines);
  else if (first === "ベースの石") parsed = parseBaseBlock(lines);
  else if (
    /^[0-9]+$/.test(first) &&
    (/^\*[\s]*石の特徴/.test(lines[1] ?? "") || (lines[1] === "*" && /石の特徴/.test(lines[2] ?? "")))
  )
    parsed = parseNumberedFeatureTail(lines);
  else if (first === "ナンバー" || /^[0-9]+$/.test(first)) parsed = parseNumerologyBlock(lines);

  if (!parsed || !parsed.stoneName) continue;

  const bad =
    /^(数秘|\*石の特徴|\*|石のキーワード)$/.test(parsed.stoneName) ||
    (parsed.stoneName.length <= 2 && /^[0-9]+$/.test(parsed.stoneName)) ||
    (parsed.category === "numerology" && parsed.stoneName === "数秘");

  if (bad) continue;

  seq += 1;
  entries.push({
    id: `${slugifyJa(parsed.stoneName)}-${seq}`,
    ...parsed,
    source: { pdf: "鑑定書用石説明改訂版v4", rawTextPath: "scripts/stonePdfV4-raw.txt" },
  });
}

const outPath = path.join(process.cwd(), "data/stonePdfV4.json");
fs.writeFileSync(
  outPath,
  `${JSON.stringify(
    {
      version: 1,
      generatedBy: "scripts/parseStonePdfV4.mjs",
      input: inPath,
      entryCount: entries.length,
      entries,
    },
    null,
    2,
  )}\n`,
  "utf8",
);
process.stdout.write(`Wrote ${outPath} (${entries.length} entries)\n`);
