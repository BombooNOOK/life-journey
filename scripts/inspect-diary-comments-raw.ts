/**
 * 製本PDF対象の generatedComment を JSON.stringify で不可視文字を確認する。
 * 実行: npx tsx scripts/inspect-diary-comments-raw.ts
 */
import { PrismaClient } from "@prisma/client";

import { generateDiaryReading } from "../src/lib/diary-reading/generateDiaryReading";
import { normalizeDiaryCommentForPdfFlow } from "../src/lib/journal/diaryCommentPdfWrap";
import { getBodyLayoutLines } from "../src/lib/journal/diaryPreviewBodyLineLimits";

const prisma = new PrismaClient();

function inspectChars(label: string, text: string) {
  const codes = [...text].map((ch) => {
    const cp = ch.codePointAt(0) ?? 0;
    if (ch === "\n") return "\\n";
    if (ch === "\r") return "\\r";
    if (ch === "\t") return "\\t";
    if (cp === 0x00a0) return "\\u00A0";
    if (cp === 0x200b) return "\\u200B";
    if (cp === 0xfeff) return "\\uFEFF";
    if (/\s/.test(ch) && ch !== " ") return `U+${cp.toString(16).toUpperCase()}`;
    return null;
  }).filter(Boolean);

  console.log(`\n=== ${label} ===`);
  console.log("JSON.stringify:", JSON.stringify(text));
  console.log("length:", text.length);
  console.log("special chars:", codes.length ? codes.join(", ") : "(none)");
  console.log("\\n count:", (text.match(/\n/g) ?? []).length);
  console.log("\\n\\n count:", (text.match(/\n\n/g) ?? []).length);
}

async function main() {
  const book = await prisma.diaryBook.findFirst({
    where: { id: "cmpxkni9g0000jp04ud4sm13r" },
  });
  if (!book) {
    console.log("book not found, using latest entries");
  }

  const rows = await prisma.journalEntry.findMany({
    where: {
      email: book?.email ?? undefined,
      generatedComment: { not: null },
    },
    orderBy: { createdAt: "asc" },
    take: 5,
    select: {
      id: true,
      createdAt: true,
      content: true,
      generatedComment: true,
    },
  });

  console.log(`entries with comments: ${rows.length}`);

  for (const row of rows) {
    const date = row.createdAt.toISOString().slice(0, 10);
    inspectChars(`comment ${date}`, row.generatedComment ?? "");
    if (row.content.trim()) {
      inspectChars(`body ${date} (first 80 chars)`, row.content.slice(0, 80));
    }
  }

  // 結合ロジックの再現
  const sample = generateDiaryReading({
    actionCategory: "work_study",
    personalDay: 5,
    monthNumber: 5,
    dayNumber: 1,
    seed: 1,
    recentTemplateIds: [],
  });
  inspectChars("generateDiaryReading fresh output", sample.text);

  const normalized = normalizeDiaryCommentForPdfFlow(sample.text);
  inspectChars("after normalizeDiaryCommentForPdfFlow", normalized);

  // 本文と同じ行分割（standard 32 chars）
  const bodyLines = getBodyLayoutLines(normalized, "standard");
  console.log("\n=== body-style line split (32 chars, standard) ===");
  bodyLines.forEach((line, i) => console.log(`${i + 1}: ${JSON.stringify(line)}`));

  const commentWidthChars = 30;
  const commentLines: string[] = [];
  for (let i = 0; i < normalized.length; i += commentWidthChars) {
    commentLines.push(normalized.slice(i, i + commentWidthChars));
  }
  console.log(`\n=== fixed ${commentWidthChars}-char split (comment width est.) ===`);
  commentLines.forEach((line, i) => console.log(`${i + 1}: ${JSON.stringify(line)}`));
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
