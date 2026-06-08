/**
 * 復元プロフィールの写真表示切り分け（本番 DB + Blob 認証）。
 *
 * 実行:
 *   npx vercel env run -e production -- bash -c '
 *     export JOURNAL_PHOTO_BLOB_STORE_ID=store_TqYctuyCkiHr9htm
 *     export JOURNAL_PHOTO_BLOB_READ_WRITE_TOKEN="$BLOB_READ_WRITE_TOKEN"
 *     set -a && source .env && set +a
 *     ALLOW_PROD_DB=1 npx tsx scripts/diagnose-restored-profile-photos.ts
 *   '
 */
import { requireSafeDatabaseUrl } from "./lib/safe-database-url";
import { getJournalEntryPhotoRecordForViewer } from "../src/lib/journal/journalEntryPhoto";
import {
  fetchJournalEntryPhotoBytesFromBlob,
  journalPhotoBlobStoreId,
  resolveJournalPhotoBlobAuth,
} from "../src/lib/journal/journalEntryPhotoBlob";
import { loadJournalEntryHasPhotoFlags } from "../src/lib/journal/journalEntryHasPhoto";
import { loadJournalEntryPhotoPayload } from "../src/lib/journal/journalEntryPhotoResolve";
import { journalEntryPhotoPayloadToDataUriForPdf } from "../src/lib/journal/journalEntryPhotoForPdf";
import { prisma } from "../src/lib/db";

const VIEWER_EMAIL = "heartfresh4119@gmail.com";

async function main() {
  requireSafeDatabaseUrl({
    scriptName: "diagnose-restored-profile-photos.ts",
    mutatesDatabase: false,
  });

  const auth = resolveJournalPhotoBlobAuth();
  const profile = await prisma.profile.findFirst({
    where: { email: VIEWER_EMAIL, nickname: "サンプル（復元）", isArchived: false },
    select: { id: true, nickname: true },
  });
  if (!profile) {
    console.error(JSON.stringify({ ok: false, error: "restored profile not found" }));
    process.exit(1);
  }

  const entries = await prisma.journalEntry.findMany({
    where: { profileId: profile.id, email: VIEWER_EMAIL },
    select: {
      id: true,
      photoBlobUrl: true,
      photoBlobPathname: true,
      photoMimeType: true,
      photoSizeBytes: true,
      photoStorageProvider: true,
      photoDataUrl: true,
    },
    orderBy: { createdAt: "asc" },
    take: 3,
  });

  const allIds = await prisma.journalEntry.findMany({
    where: { profileId: profile.id, email: VIEWER_EMAIL },
    select: { id: true },
  });
  const hasPhotoFlags = await loadJournalEntryHasPhotoFlags({
    email: VIEWER_EMAIL,
    entryIds: allIds.map((r) => r.id),
  });

  const blobMetaComplete = entries.every(
    (e) =>
      e.photoBlobUrl &&
      e.photoBlobPathname &&
      e.photoMimeType &&
      e.photoSizeBytes != null &&
      e.photoStorageProvider,
  );

  const samples = [];
  for (const entry of entries) {
    const record = await getJournalEntryPhotoRecordForViewer({
      entryId: entry.id,
      viewerEmail: VIEWER_EMAIL,
    });
    const payload = record ? await loadJournalEntryPhotoPayload(record) : null;
    let blobDirect: { ok: boolean; bytes: number; mimeType: string | null } = {
      ok: false,
      bytes: 0,
      mimeType: null,
    };
    if (entry.photoBlobUrl) {
      const fetched = await fetchJournalEntryPhotoBytesFromBlob(entry.photoBlobUrl);
      blobDirect = {
        ok: fetched != null,
        bytes: fetched?.buffer.byteLength ?? 0,
        mimeType: fetched?.mimeType ?? null,
      };
    }
    let pdfMime: string | null = null;
    if (payload) {
      const uri = await journalEntryPhotoPayloadToDataUriForPdf(payload);
      pdfMime = uri.slice(5, uri.indexOf(";"));
    }

    samples.push({
      entryId: entry.id,
      hasPhotoFlag: hasPhotoFlags.get(entry.id) === true,
      photoRecordFound: record != null,
      payloadKind: payload?.kind ?? null,
      blobDirectFetch: blobDirect,
      pdfDataUriMime: pdfMime,
      dbMeta: {
        photoBlobUrl: Boolean(entry.photoBlobUrl),
        photoBlobPathname: entry.photoBlobPathname,
        photoMimeType: entry.photoMimeType,
        photoSizeBytes: entry.photoSizeBytes,
        photoStorageProvider: entry.photoStorageProvider,
      },
    });
  }

  const withPhotoCount = [...hasPhotoFlags.values()].filter(Boolean).length;

  // 本番相当: 専用 env が空でも BLOB_* フォールバックで認証できるか
  const prodLikeEnv = { ...process.env };
  prodLikeEnv.JOURNAL_PHOTO_BLOB_STORE_ID = "";
  prodLikeEnv.JOURNAL_PHOTO_BLOB_READ_WRITE_TOKEN = "";
  const prevEnv = process.env;
  process.env = prodLikeEnv;
  const prodLikeAuth = resolveJournalPhotoBlobAuth();
  const prodLikeStoreId = journalPhotoBlobStoreId();
  process.env = prevEnv;

  console.log(
    JSON.stringify(
      {
        ok: true,
        runtime: {
          nodeEnv: process.env.NODE_ENV ?? null,
          vercel: process.env.VERCEL ?? null,
          blobStoreId: journalPhotoBlobStoreId(),
          blobAuthMode: auth?.mode ?? null,
          dedicatedJournalStoreIdSet: Boolean(process.env.JOURNAL_PHOTO_BLOB_STORE_ID?.trim()),
          hasJournalPhotoReadWriteToken: Boolean(process.env.JOURNAL_PHOTO_BLOB_READ_WRITE_TOKEN?.trim()),
          hasBlobReadWriteToken: Boolean(process.env.BLOB_READ_WRITE_TOKEN?.trim()),
          hasOidcToken: Boolean(process.env.VERCEL_OIDC_TOKEN?.trim()),
          prodLikeAuthMode: prodLikeAuth?.mode ?? null,
          prodLikeStoreId,
        },
        profile,
        entryCount: allIds.length,
        hasPhotoFlagCount: withPhotoCount,
        blobMetaCompleteOnSamples: blobMetaComplete,
        samples,
      },
      null,
      2,
    ),
  );
}

void main()
  .then(() => prisma.$disconnect())
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
