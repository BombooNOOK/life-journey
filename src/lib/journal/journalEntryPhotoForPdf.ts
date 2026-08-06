import sharp from "sharp";

import { parseJournalPhotoDataUrl } from "@/lib/journal/journalEntryPhotoBlob";
import type { JournalEntryPhotoPayload } from "@/lib/journal/journalEntryPhotoResolve";

const PDF_SUPPORTED_MIME_TYPES = new Set(["image/jpeg", "image/jpg", "image/png"]);

function normalizeImageMimeType(mimeType: string): string {
  return mimeType.trim().toLowerCase().split(";")[0] ?? "";
}

export function isPdfSupportedImageMimeType(mimeType: string): boolean {
  return PDF_SUPPORTED_MIME_TYPES.has(normalizeImageMimeType(mimeType));
}

async function convertImageBytesToJpegForPdf(buffer: Buffer): Promise<Buffer> {
  return sharp(buffer).jpeg({ quality: 92 }).toBuffer();
}

function bytesToDataUri(buffer: Buffer, mimeType: string): string {
  return `data:${normalizeImageMimeType(mimeType)};base64,${buffer.toString("base64")}`;
}

async function bytesToPdfDataUri(buffer: Buffer, mimeType: string): Promise<string> {
  if (isPdfSupportedImageMimeType(mimeType)) {
    return bytesToDataUri(buffer, mimeType);
  }
  const jpeg = await convertImageBytesToJpegForPdf(buffer);
  return bytesToDataUri(jpeg, "image/jpeg");
}

/**
 * @react-pdf は WebP 非対応のため、PDF 埋め込み用 data URI だけ JPEG/PNG に揃える。
 * あしあと表示・Blob 保存には使わない。
 */
export async function journalEntryPhotoPayloadToDataUriForPdf(
  payload: JournalEntryPhotoPayload,
): Promise<string> {
  if (payload.kind === "legacy_json") {
    const parsed = parseJournalPhotoDataUrl(payload.photoDataUrl);
    if (!parsed) return payload.photoDataUrl;
    return bytesToPdfDataUri(parsed.buffer, parsed.mimeType);
  }

  return bytesToPdfDataUri(payload.buffer, payload.mimeType);
}
