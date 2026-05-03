import { createHash } from "node:crypto";

import { put } from "@vercel/blob";

import type { BodyTuneStep, FocusPage, PdfRenderQuality } from "@/components/pdf/pdfRenderConfig";

/** 鑑定フルPDFを Blob にキャッシュするのは「通常の冊子全体」のみ（章抜き・本文調整は毎回生成） */
export function orderFullPdfRequestCacheable(focusPage: FocusPage, bodyTune: BodyTuneStep): boolean {
  return focusPage === "all" && bodyTune === "normal";
}

export function orderPdfBlobWriteEnabled(): boolean {
  return Boolean(process.env.BLOB_READ_WRITE_TOKEN?.trim());
}

/**
 * PDF 結合ロジックや挿入アセット解決を変えたときに上げる（Blob の古いキャッシュを捨てる）。
 * 例: 本番で章挿入・裏表紙 PDF のパスが ENOENT になっていた修正後。
 */
const ORDER_FULL_PDF_BLOB_CACHE_REVISION = "2";

/** 鑑定 PDF の入力が同じなら同じ指紋（画質は URL を分けるため指紋に含めない） */
export function buildOrderPdfCacheFingerprint(row: {
  numerologyJson: string;
  stonesJson: string;
  stoneFocusTheme: string;
  birthDate: string;
  birthYear: number;
  birthMonth: number;
  birthDay: number;
  lastName: string;
  firstName: string;
  lastNameKana: string;
  firstNameKana: string;
  lastNameRoman: string;
  firstNameRoman: string;
  fullNameDisplay: string;
  fullNameKanaDisplay: string;
  fullNameRomanDisplay: string;
  postalCode: string;
  address: string;
  phone: string;
  email: string;
  profileId: string;
}): string {
  return createHash("sha256")
    .update(JSON.stringify(row))
    .update(`|blobRev=${ORDER_FULL_PDF_BLOB_CACHE_REVISION}`)
    .digest("hex");
}

export async function fetchCachedOrderPdfFromBlobUrl(blobUrl: string): Promise<Uint8Array | null> {
  try {
    const res = await fetch(blobUrl, { method: "GET", cache: "no-store" });
    if (!res.ok) return null;
    const ct = res.headers.get("content-type") ?? "";
    if (!ct.includes("pdf") && !ct.includes("octet-stream")) return null;
    return new Uint8Array(await res.arrayBuffer());
  } catch {
    return null;
  }
}

export async function putOrderFullPdfToBlob(
  orderId: string,
  quality: PdfRenderQuality,
  bytes: Uint8Array,
): Promise<string> {
  const token = process.env.BLOB_READ_WRITE_TOKEN?.trim();
  if (!token) throw new Error("BLOB_READ_WRITE_TOKEN is not set");
  const variant = quality === "high" ? "print" : "preview";
  const pathname = `order-full-pdf/${orderId}/${variant}.pdf`;
  const body = Buffer.from(bytes);
  const result = await put(pathname, body, {
    access: "public",
    addRandomSuffix: false,
    contentType: "application/pdf",
    token,
  });
  return result.url;
}
