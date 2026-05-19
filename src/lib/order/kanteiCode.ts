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
