import { randomBytes } from "node:crypto";

import { prisma } from "@/lib/db";

const KANTEI_CODE_PREFIX = "LJK";
const SUFFIX_ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
const ASSIGN_MAX_ATTEMPTS = 8;

/** order.createdAt を Asia/Tokyo で YYYYMMDD にする */
export function formatKanteiCodeDatePart(createdAt: Date): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Tokyo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(createdAt);
  const year = parts.find((p) => p.type === "year")?.value ?? "0000";
  const month = parts.find((p) => p.type === "month")?.value ?? "00";
  const day = parts.find((p) => p.type === "day")?.value ?? "00";
  return `${year}${month}${day}`;
}

export function randomKanteiCodeSuffix(length = 4): string {
  const bytes = randomBytes(length);
  let suffix = "";
  for (let i = 0; i < length; i++) {
    suffix += SUFFIX_ALPHABET[bytes[i]! % SUFFIX_ALPHABET.length]!;
  }
  return suffix;
}

/** LJK-YYYYMMDD-XXXX（日付は注文作成日・Asia/Tokyo） */
export function buildKanteiCode(createdAt: Date): string {
  return `${KANTEI_CODE_PREFIX}-${formatKanteiCodeDatePart(createdAt)}-${randomKanteiCodeSuffix(4)}`;
}

export type KanteiPdfVariant = "preview" | "print";

export function buildKanteiPdfDownloadFilename(
  kanteiCode: string,
  variant: KanteiPdfVariant,
): string {
  return `LifeJourney_Kantei_${kanteiCode}_${variant}.pdf`;
}

/** kanteiCode 未付与時の旧ファイル名（内部 id 先頭8文字） */
export function buildLegacyKanteiPdfDownloadFilename(
  orderId: string,
  variant: KanteiPdfVariant,
): string {
  return `kantei-${orderId.slice(0, 8)}-${variant}.pdf`;
}

export type KanteiPdfFilenameTune = {
  focusPage?: string;
  bodyTune?: string;
};

/**
 * kanteiCode があれば新形式、なければ旧形式。PDF 返却を止めないための統一ヘルパー。
 */
export function resolveKanteiPdfDownloadFilename(
  orderId: string,
  kanteiCode: string | null | undefined,
  variant: KanteiPdfVariant,
  tune: KanteiPdfFilenameTune = {},
): string {
  const focusPage = tune.focusPage ?? "all";
  const bodyTune = tune.bodyTune ?? "normal";
  const fullBooklet = bodyTune === "normal" && focusPage === "all";

  if (kanteiCode) {
    return fullBooklet
      ? buildKanteiPdfDownloadFilename(kanteiCode, variant)
      : `LifeJourney_Kantei_${kanteiCode}_${focusPage}-${bodyTune}-${variant}.pdf`;
  }

  return fullBooklet
    ? buildLegacyKanteiPdfDownloadFilename(orderId, variant)
    : `kantei-${orderId.slice(0, 8)}-${focusPage}-${bodyTune}-${variant}.pdf`;
}

/**
 * kanteiCode 付与を試みる。失敗しても例外を投げず null（ログのみ）。
 * DB カラム未反映・unique 衝突連続などで PDF API 全体が落ちないようにする。
 */
export async function resolveOrderKanteiCodeSafe(
  orderId: string,
  logTag = "resolveOrderKanteiCodeSafe",
): Promise<string | null> {
  try {
    return await ensureOrderKanteiCode(orderId);
  } catch (err) {
    const detail =
      err instanceof Error
        ? { name: err.name, message: err.message, stack: err.stack }
        : { raw: String(err) };
    console.error(`[kanteiCode] ${logTag} failed`, { orderId, error: detail });

    try {
      const row = await prisma.order.findUnique({
        where: { id: orderId },
        select: { kanteiCode: true },
      });
      return row?.kanteiCode ?? null;
    } catch (readErr) {
      console.error(`[kanteiCode] ${logTag} read-back failed`, {
        orderId,
        error: readErr instanceof Error ? readErr.message : String(readErr),
      });
      return null;
    }
  }
}

function isPrismaUniqueViolation(err: unknown): boolean {
  return (
    typeof err === "object" &&
    err !== null &&
    "code" in err &&
    (err as { code: string }).code === "P2002"
  );
}

/**
 * 未設定の注文に kanteiCode を付与して返す。設定済みならそのまま返す。
 * unique 衝突時はリトライ。並行リクエスト時は再読込で既存値を拾う。
 */
export async function ensureOrderKanteiCode(orderId: string): Promise<string> {
  const existing = await prisma.order.findUnique({
    where: { id: orderId },
    select: { kanteiCode: true, createdAt: true },
  });
  if (!existing) {
    throw new Error(`Order not found: ${orderId}`);
  }
  if (existing.kanteiCode) {
    return existing.kanteiCode;
  }

  for (let attempt = 0; attempt < ASSIGN_MAX_ATTEMPTS; attempt++) {
    const candidate = buildKanteiCode(existing.createdAt);
    try {
      const updated = await prisma.order.updateMany({
        where: { id: orderId, kanteiCode: null },
        data: { kanteiCode: candidate },
      });
      if (updated.count === 1) {
        return candidate;
      }
    } catch (err) {
      if (!isPrismaUniqueViolation(err)) {
        throw err;
      }
    }

    const raced = await prisma.order.findUnique({
      where: { id: orderId },
      select: { kanteiCode: true },
    });
    if (raced?.kanteiCode) {
      return raced.kanteiCode;
    }
  }

  throw new Error(`Failed to assign kanteiCode for order ${orderId}`);
}
