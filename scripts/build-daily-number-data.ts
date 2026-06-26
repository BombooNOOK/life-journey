/**
 * docs/daily-number-*.csv を検証し、generated/*.ts を出力する。
 *
 *   npm run daily-number:data:build
 *   npm run daily-number:data:validate
 */
import { mkdirSync, unlinkSync, writeFileSync } from "node:fs";
import path from "node:path";

import {
  readCsvRecords,
  splitPipeList,
  tsStringArray,
  tsStringLiteral,
} from "../src/lib/admin/post-atelier/daily-number/csvIO";
import {
  assertDailyNumberCoverLayoutsValid,
  assertDailyNumberMessageLayoutsValid,
} from "../src/lib/admin/post-atelier/daily-number/layoutTextValidation";

const COVER_CSV = "daily-number-today-cover-owl.csv";
const MESSAGES_CSV = "daily-number-messages-owl-base.csv";
const LIFE_PATHS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 11, 22, 33] as const;
const TODAY_NUMBERS = [1, 2, 3, 4, 5, 6, 7, 8, 9] as const;
const COVER_VARIANTS = ["A", "B", "C"] as const;
const COVER_SEASONS = ["base", "spring", "summer", "autumn", "winter"] as const;
const SPECIAL_SEASONS = [
  "new_year",
  "new_life",
  "obon",
  "autumn_night",
  "christmas",
  "year_end",
] as const;
const GENERATED_DIR = path.join(
  process.cwd(),
  "src/lib/admin/post-atelier/daily-number/generated",
);

type CoverRow = {
  todayNumber: number;
  season: (typeof COVER_SEASONS)[number];
  specialSeason?: (typeof SPECIAL_SEASONS)[number];
  variant: (typeof COVER_VARIANTS)[number];
  title: string;
  summaryMessage: string;
  colorName: string;
  themeKeywords: string[];
  toneNotes: string[];
  avoidNotes: string[];
  notes: string;
};

type MessageRow = {
  todayNumber: number;
  lifePathNumber: number;
  character: string;
  messageType: string;
  variant: (typeof COVER_VARIANTS)[number];
  colorName: string;
  body: string;
  action1: string;
  action2: string;
  notes: string;
};

function messageRowKey(row: Pick<MessageRow, "todayNumber" | "lifePathNumber" | "character" | "messageType" | "variant">): string {
  return `${row.todayNumber}:${row.lifePathNumber}:${row.character}:${row.messageType}:${row.variant}`;
}

function isFilled(...values: string[]): boolean {
  return values.every((v) => v.trim().length > 0);
}

function coverRowKey(row: Pick<CoverRow, "todayNumber" | "season" | "specialSeason" | "variant">): string {
  return `${row.todayNumber}:${row.specialSeason ?? ""}:${row.season}:${row.variant}`;
}

function parseCoverRows(): CoverRow[] {
  const records = readCsvRecords(COVER_CSV);
  const rows: CoverRow[] = [];

  for (const record of records) {
    const todayNumber = Number(record.todayNumber);
    if (!TODAY_NUMBERS.includes(todayNumber as (typeof TODAY_NUMBERS)[number])) {
      throw new Error(`${COVER_CSV}: todayNumber が不正です: ${record.todayNumber}`);
    }

    const seasonRaw = (record.season ?? "base").trim() || "base";
    if (!COVER_SEASONS.includes(seasonRaw as (typeof COVER_SEASONS)[number])) {
      throw new Error(`${COVER_CSV}: season が不正です: ${seasonRaw}`);
    }

    const specialRaw = (record.specialSeason ?? "").trim();
    if (specialRaw && !SPECIAL_SEASONS.includes(specialRaw as (typeof SPECIAL_SEASONS)[number])) {
      throw new Error(`${COVER_CSV}: specialSeason が不正です: ${specialRaw}`);
    }

    const variantRaw = (record.variant ?? "A").trim() || "A";
    if (!COVER_VARIANTS.includes(variantRaw as (typeof COVER_VARIANTS)[number])) {
      throw new Error(`${COVER_CSV}: variant が不正です: ${variantRaw}`);
    }

    rows.push({
      todayNumber,
      season: seasonRaw as (typeof COVER_SEASONS)[number],
      specialSeason: specialRaw
        ? (specialRaw as (typeof SPECIAL_SEASONS)[number])
        : undefined,
      variant: variantRaw as (typeof COVER_VARIANTS)[number],
      title: record.title ?? "",
      summaryMessage: record.summaryMessage ?? "",
      colorName: record.colorName ?? "",
      themeKeywords: splitPipeList(record.themeKeywords ?? ""),
      toneNotes: splitPipeList(record.toneNotes ?? ""),
      avoidNotes: splitPipeList(record.avoidNotes ?? ""),
      notes: record.notes ?? "",
    });
  }

  const keys = new Set<string>();
  for (const row of rows) {
    const key = coverRowKey(row);
    if (keys.has(key)) {
      throw new Error(`${COVER_CSV}: キーが重複しています: ${key}`);
    }
    keys.add(key);
  }

  for (const todayNumber of TODAY_NUMBERS) {
    for (const variant of COVER_VARIANTS) {
      const key = `${todayNumber}::base:${variant}`;
      if (!keys.has(key)) {
        throw new Error(
          `${COVER_CSV}: base スロットが不足しています (UD${todayNumber} variant ${variant})`,
        );
      }
    }
  }

  return rows.sort((a, b) => {
    if (a.todayNumber !== b.todayNumber) return a.todayNumber - b.todayNumber;
    if (a.season !== b.season) return a.season.localeCompare(b.season);
    if ((a.specialSeason ?? "") !== (b.specialSeason ?? "")) {
      return (a.specialSeason ?? "").localeCompare(b.specialSeason ?? "");
    }
    return a.variant.localeCompare(b.variant);
  });
}

function parseMessageRows(): MessageRow[] {
  const records = readCsvRecords(MESSAGES_CSV);
  const rows: MessageRow[] = [];

  for (const record of records) {
    const todayNumber = Number(record.todayNumber);
    const lifePathNumber = Number(record.lifePathNumber);
    if (!TODAY_NUMBERS.includes(todayNumber as (typeof TODAY_NUMBERS)[number])) {
      throw new Error(`${MESSAGES_CSV}: todayNumber が不正です: ${record.todayNumber}`);
    }
    if (!LIFE_PATHS.includes(lifePathNumber as (typeof LIFE_PATHS)[number])) {
      throw new Error(`${MESSAGES_CSV}: lifePathNumber が不正です: ${record.lifePathNumber}`);
    }
    const variantRaw = (record.variant ?? "A").trim() || "A";
    if (!COVER_VARIANTS.includes(variantRaw as (typeof COVER_VARIANTS)[number])) {
      throw new Error(`${MESSAGES_CSV}: variant が不正です: ${variantRaw}`);
    }
    rows.push({
      todayNumber,
      lifePathNumber,
      character: record.character ?? "",
      messageType: record.messageType ?? "",
      variant: variantRaw as (typeof COVER_VARIANTS)[number],
      colorName: record.colorName ?? "",
      body: record.body ?? "",
      action1: record.action1 ?? "",
      action2: record.action2 ?? "",
      notes: record.notes ?? "",
    });
  }

  const keys = new Set<string>();
  for (const row of rows) {
    const key = messageRowKey(row);
    if (keys.has(key)) {
      throw new Error(`${MESSAGES_CSV}: キーが重複しています: ${key}`);
    }
    keys.add(key);
    if (row.character !== "owl" || row.messageType !== "base") {
      throw new Error(
        `${MESSAGES_CSV}: Phase 2 は character=owl / messageType=base のみです (${key})`,
      );
    }
  }

  for (const todayNumber of TODAY_NUMBERS) {
    for (const lifePathNumber of LIFE_PATHS) {
      for (const variant of COVER_VARIANTS) {
        const key = `${todayNumber}:${lifePathNumber}:owl:base:${variant}`;
        if (!keys.has(key)) {
          throw new Error(
            `${MESSAGES_CSV}: スロットが不足しています (UD${todayNumber} LP${lifePathNumber} variant ${variant})`,
          );
        }
      }
    }
  }

  if (rows.length !== 324) {
    throw new Error(`${MESSAGES_CSV}: 行数は 324 件である必要があります（現在 ${rows.length} 件）`);
  }

  return rows;
}

function reportCompleteness(coverRows: CoverRow[], messageRows: MessageRow[]): void {
  for (const todayNumber of TODAY_NUMBERS) {
    const baseCovers = coverRows.filter(
      (r) => r.todayNumber === todayNumber && r.season === "base" && !r.specialSeason,
    );
    const coverA = baseCovers.find((r) => r.variant === "A");
    const coverReady = coverA != null && isFilled(coverA.title, coverA.summaryMessage);
    const variantReady = baseCovers.filter((r) => isFilled(r.title, r.summaryMessage)).length;

    const messages = messageRows.filter(
      (r) => r.todayNumber === todayNumber && r.variant === "A",
    );
    const messageReadyCount = messages.filter((r) =>
      isFilled(r.body, r.action1, r.action2, r.colorName),
    ).length;

    const status = coverReady && messageReadyCount === 12 ? "ready" : "partial";
    console.log(
      `  UD${todayNumber}: ${status} (coverA=${coverReady ? "ok" : "missing"}, coverVariants=${variantReady}/3, messages=${messageReadyCount}/12)`,
    );
  }
}

function buildCoverVariantsTs(rows: CoverRow[]): string {
  const complete = rows.filter((r) => isFilled(r.title, r.summaryMessage));
  const items = complete
    .map((r) => {
      const specialSeasonLine = r.specialSeason
        ? `\n    specialSeason: ${tsStringLiteral(r.specialSeason)},`
        : "";
      return `  {
    todayNumber: ${r.todayNumber},
    season: ${tsStringLiteral(r.season)},${specialSeasonLine}
    variant: ${tsStringLiteral(r.variant)},
    title: ${tsStringLiteral(r.title)},
    summaryMessage: ${tsStringLiteral(r.summaryMessage)},
    colorName: ${tsStringLiteral(r.colorName)},
    themeKeywords: ${tsStringArray(r.themeKeywords)},
    toneNotes: ${tsStringArray(r.toneNotes)},
    avoidNotes: ${tsStringArray(r.avoidNotes)},
  }`;
    })
    .join(",\n");

  return `import type { TodayNumberCoverVariantRecord } from "../types";

/** Generated from docs/${COVER_CSV}. Do not edit by hand. */
export const TODAY_NUMBER_COVER_VARIANTS: TodayNumberCoverVariantRecord[] = [
${items},
];
`;
}

function buildMessagesTs(rows: MessageRow[]): string {
  const complete = rows.filter((r) => isFilled(r.body, r.action1, r.action2, r.colorName));
  const items = complete
    .map((r) => {
      return `  {
    todayNumber: ${r.todayNumber},
    lifePathNumber: ${r.lifePathNumber},
    character: "owl",
    messageType: "base",
    subTheme: "",
    variant: ${tsStringLiteral(r.variant)},
    body: ${tsStringLiteral(r.body)},
    colorName: ${tsStringLiteral(r.colorName)},
    actions: [${tsStringLiteral(r.action1)}, ${tsStringLiteral(r.action2)}] as [string, string],
    notes: ${tsStringLiteral(r.notes || `UD${r.todayNumber}×LP${r.lifePathNumber}×owl base ${r.variant}`)},
  }`;
    })
    .join(",\n");

  return `import type { DailyNumberMessage } from "../types";
import { PERSONAL_NUMBER_MASTERS } from "../personalNumberMasters";

function attachPersonalMeta(message: Omit<DailyNumberMessage, "displayName" | "subtitle">): DailyNumberMessage {
  const master = PERSONAL_NUMBER_MASTERS.find((m) => m.lifePathNumber === message.lifePathNumber);
  if (!master) throw new Error(\`Unknown lifePathNumber: \${message.lifePathNumber}\`);
  return {
    ...message,
    displayName: master.displayName,
    subtitle: master.subtitle,
  };
}

const RAW_MESSAGES: Array<Omit<DailyNumberMessage, "displayName" | "subtitle">> = [
${items},
];

/** Generated from docs/${MESSAGES_CSV}. Do not edit by hand. */
export const DAILY_NUMBER_MESSAGES: DailyNumberMessage[] = RAW_MESSAGES.map(attachPersonalMeta);
`;
}

function main(): void {
  const validateOnly = process.argv.includes("--validate");
  const coverRows = parseCoverRows();
  const messageRows = parseMessageRows();

  assertDailyNumberCoverLayoutsValid(
    coverRows.map((r) => ({
      todayNumber: r.todayNumber,
      variant: r.variant,
      summaryMessage: r.summaryMessage,
    })),
  );
  assertDailyNumberMessageLayoutsValid(
    messageRows.map((r) => ({
      todayNumber: r.todayNumber,
      lifePathNumber: r.lifePathNumber,
      variant: r.variant,
      body: r.body,
      action1: r.action1,
      action2: r.action2,
    })),
  );

  console.log("Daily number CSV status:");
  reportCompleteness(coverRows, messageRows);

  const coverReady = coverRows.filter(
    (r) =>
      r.season === "base" &&
      !r.specialSeason &&
      r.variant === "A" &&
      isFilled(r.title, r.summaryMessage),
  ).length;
  const coverVariantReady = coverRows.filter((r) => isFilled(r.title, r.summaryMessage)).length;
  const messageReady = messageRows.filter((r) =>
    isFilled(r.body, r.action1, r.action2, r.colorName),
  ).length;
  const messageVariantAReady = messageRows.filter(
    (r) => r.variant === "A" && isFilled(r.body, r.action1, r.action2, r.colorName),
  ).length;

  if (validateOnly) {
    console.log(
      `\nValidation OK (${coverReady}/9 cover base A, ${coverVariantReady} cover variants total, ${messageVariantAReady}/108 messages variant A ready, ${messageReady}/324 total slots filled, layout text OK).`,
    );
    return;
  }

  mkdirSync(GENERATED_DIR, { recursive: true });
  writeFileSync(
    path.join(GENERATED_DIR, "todayNumberCoverVariants.ts"),
    buildCoverVariantsTs(coverRows),
  );
  writeFileSync(
    path.join(GENERATED_DIR, "dailyNumberMessages.ts"),
    buildMessagesTs(messageRows),
  );
  try {
    unlinkSync(path.join(GENERATED_DIR, "todayNumberMasters.ts"));
  } catch {
    // legacy file
  }
  console.log(
    `\nWrote generated/*.ts (${coverReady} cover base A, ${coverVariantReady} cover variants, ${messageVariantAReady} messages variant A).`,
  );
}

main();
