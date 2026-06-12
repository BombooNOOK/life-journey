/**
 * 日記ブック entries API と同型の JSON サイズを測定（読み取り専用）。
 *
 * ⚠️ 本番 Neon で実行すると Network transfer を消費します。
 *    日記本文・コメントを冊ごとに読むため、1 冊あたり数百 KB〜数 MB 級です。
 *    旧実装で JSON に photoDataUrl が含まれる場合はさらに大きくなります。
 *
 * 通常はローカル DB: docs/DEV_DATABASE.md
 * 本番でどうしても 1 回: docs/PROD_DATABASE_INVESTIGATION.md
 *
 * 使い方: npx tsx scripts/measure-diary-book-entries-payload.ts
 * 任意: BOOK_ID=... VIEWER_EMAIL=... で1冊に絞る
 * 本番（非推奨）: ALLOW_PROD_DB=1 npx tsx scripts/measure-diary-book-entries-payload.ts
 */
import { brotliCompressSync, gzipSync } from "zlib";

import { requireSafeDatabaseUrl } from "./lib/safe-database-url";
import { serializeDiaryBook } from "../src/lib/journal/diaryBookDto";
import {
  countDiaryBookSnapshotEntries,
  diaryBookNeedsContentRefresh,
} from "../src/lib/journal/diaryBookSnapshot";
import { listJournalEntriesForDiaryBookRow } from "../src/lib/journal/listDiaryBookEntries";
import { prisma } from "../src/lib/db";

function dbLabel(url: string): string {
  try {
    const u = new URL(url.replace(/^postgresql:/, "http:"));
    return `${u.hostname}/${u.pathname.replace(/^\//, "").split("?")[0]}`;
  } catch {
    return "(parse failed)";
  }
}

async function buildEntriesApiBodyForBook(bookId: string) {
  const row = await prisma.diaryBook.findFirst({ where: { id: bookId } });
  if (!row) return null;

  const [entries, entryCount, needsContentRefresh] = await Promise.all([
    listJournalEntriesForDiaryBookRow({
      book: row,
      viewerEmail: row.email,
      respectSnapshot: true,
    }),
    countDiaryBookSnapshotEntries({
      email: row.email,
      profileId: row.profileId,
      startDate: row.startDate,
      endDate: row.endDate,
      bookUpdatedAt: row.updatedAt,
    }),
    diaryBookNeedsContentRefresh({
      email: row.email,
      profileId: row.profileId,
      startDate: row.startDate,
      endDate: row.endDate,
      bookUpdatedAt: row.updatedAt,
    }),
  ]);

  const book = serializeDiaryBook(row, entryCount, { needsContentRefresh });
  return {
    book,
    profileId: row.profileId,
    entries,
    needsContentRefresh: book.needsContentRefresh === true,
    code: "OK" as const,
  };
}

function analyzeJson(json: string) {
  const utf8Bytes = Buffer.byteLength(json, "utf8");
  const gzipBytes = gzipSync(json, { level: 6 }).length;
  const brBytes = brotliCompressSync(json, {
    params: { [require("zlib").constants.BROTLI_PARAM_QUALITY]: 4 },
  }).length;
  return { chars: json.length, utf8Bytes, gzipBytes, brBytes };
}

function entryFieldStats(entries: { content: string; hasPhoto?: boolean; photoDataUrl?: string | null }[]) {
  let photoCount = 0;
  let contentChars = 0;
  for (const e of entries) {
    contentChars += e.content?.length ?? 0;
    if (e.hasPhoto === true) photoCount += 1;
  }
  const hasPhotoFieldInJson = entries.some(
    (e) => Object.prototype.hasOwnProperty.call(e, "photoDataUrl") && e.photoDataUrl != null,
  );
  return { photoCount, photoChars: 0, contentChars, hasPhotoFieldInJson };
}

async function measureBook(bookId: string) {
  const body = await buildEntriesApiBodyForBook(bookId);
  if (!body) {
    return { bookId, found: false as const };
  }
  const json = JSON.stringify(body);
  const sizes = analyzeJson(json);
  const fields = entryFieldStats(body.entries);
  return {
    bookId,
    found: true as const,
    title: body.book.title,
    startDate: body.book.startDate,
    endDate: body.book.endDate,
    entryCount: body.entries.length,
    bookEntryCountField: body.book.entryCount,
    ...fields,
    ...sizes,
    mbUtf8: sizes.utf8Bytes / (1024 * 1024),
    mbGzip: sizes.gzipBytes / (1024 * 1024),
    mbBr: sizes.brBytes / (1024 * 1024),
  };
}

async function main() {
  requireSafeDatabaseUrl({
    scriptName: "measure-diary-book-entries-payload.ts",
    readsLargeJournalPayload: true,
  });

  const filterBookId = process.env.BOOK_ID?.trim();
  const filterEmail = process.env.VIEWER_EMAIL?.trim();

  const books = await prisma.diaryBook.findMany({
    where: {
      ...(filterBookId ? { id: filterBookId } : {}),
      ...(filterEmail ? { email: filterEmail } : {}),
    },
    orderBy: { createdAt: "desc" },
    select: { id: true, email: true, title: true },
  });

  if (books.length === 0) {
    console.log("No DiaryBook rows matched.");
    return;
  }

  console.log(`\nMeasuring ${books.length} diary book(s)…\n`);

  const results = [];
  for (const b of books) {
    const r = await measureBook(b.id);
    results.push(r);
    if (!r.found) {
      console.log(`- ${b.id}: NOT FOUND for viewer`);
      continue;
    }
    console.log(`--- ${r.title} (${r.bookId}) ---`);
    console.log(`  period: ${r.startDate} .. ${r.endDate}`);
    console.log(`  entries in API: ${r.entryCount} (book.entryCount=${r.bookEntryCountField})`);
    console.log(`  hasPhoto: ${r.photoCount} entries (photoDataUrl in JSON: ${r.hasPhotoFieldInJson ? "YES" : "no"})`);
    console.log(`  content: ${r.contentChars.toLocaleString()} chars`);
    console.log(`  JSON: ${r.chars.toLocaleString()} chars, ${r.utf8Bytes.toLocaleString()} bytes (${r.mbUtf8.toFixed(2)} MB)`);
    console.log(`  gzip~: ${r.gzipBytes.toLocaleString()} bytes (${r.mbGzip.toFixed(2)} MB)`);
    console.log(`  br~:   ${r.brBytes.toLocaleString()} bytes (${r.mbBr.toFixed(2)} MB)`);
    console.log("");
  }

  const found = results.filter((r): r is Extract<typeof r, { found: true }> => r.found);
  if (found.length > 1) {
    const max = found.reduce((a, b) => (a.utf8Bytes >= b.utf8Bytes ? a : b));
    const sumUtf8 = found.reduce((s, r) => s + r.utf8Bytes, 0);
    console.log("SUMMARY (all books):");
    console.log(`  largest: "${max.title}" ${max.mbUtf8.toFixed(2)} MB utf8 / ${max.mbGzip.toFixed(2)} MB gzip`);
    console.log(`  if user opened each book once: ~${(sumUtf8 / (1024 * 1024)).toFixed(2)} MB utf8 API total (browser)`);
    console.log(`  Neon egress per open ≈ DB row read size (similar order to utf8 JSON, often 0.8–1.0×)`);
  }

  // Bookshelf: count queries per book (no photo/content)
  const profileGroups = new Map<string, string[]>();
  for (const b of books) {
    const row = await prisma.diaryBook.findUnique({
      where: { id: b.id },
      select: { profileId: true, email: true },
    });
    if (!row) continue;
    const key = `${row.email}\0${row.profileId}`;
    const list = profileGroups.get(key) ?? [];
    list.push(b.id);
    profileGroups.set(key, list);
  }
  console.log("\nBookshelf SSR note:");
  for (const [key, ids] of profileGroups) {
    const n = ids.length;
    console.log(
      `  profile ${key.split("\0")[1]?.slice(0, 8)}…: ${n} books → ~${n * 2} small Prisma queries (count + needsRefresh each)`,
    );
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
