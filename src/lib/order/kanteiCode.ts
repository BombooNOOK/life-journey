import { randomBytes } from "node:crypto";

import { Prisma } from "@prisma/client";

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

/** Runtime Logs / 切り分け用のエラー整形 */
export function formatKanteiCodeErrorDetail(err: unknown): Record<string, unknown> {
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    return {
      kind: "PrismaClientKnownRequestError",
      name: err.name,
      message: err.message,
      prismaCode: err.code,
      meta: err.meta,
      clientVersion: err.clientVersion,
    };
  }
  if (err instanceof Prisma.PrismaClientUnknownRequestError) {
    return {
      kind: "PrismaClientUnknownRequestError",
      name: err.name,
      message: err.message,
      clientVersion: err.clientVersion,
    };
  }
  if (err instanceof Prisma.PrismaClientInitializationError) {
    return {
      kind: "PrismaClientInitializationError",
      name: err.name,
      message: err.message,
      errorCode: err.errorCode,
      clientVersion: err.clientVersion,
    };
  }
  if (err instanceof Error) {
    return {
      kind: "Error",
      name: err.name,
      message: err.message,
      stack: err.stack,
      cause:
        err.cause instanceof Error
          ? { name: err.cause.name, message: err.cause.message }
          : err.cause != null
            ? String(err.cause)
            : undefined,
    };
  }
  return { kind: "unknown", raw: String(err) };
}

/** 本番DBに kanteiCode 列があるか（information_schema） */
export async function kanteiCodeColumnExistsInDatabase(): Promise<boolean> {
  const rows = await prisma.$queryRaw<{ exists: boolean }[]>`
    SELECT EXISTS (
      SELECT 1
      FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = 'Order'
        AND column_name = 'kanteiCode'
    ) AS "exists"
  `;
  return rows[0]?.exists === true;
}

export type KanteiCodeDiagnostics = {
  columnExists: boolean;
  ordersMissingKanteiCode: number | null;
  ordersWithKanteiCode: number | null;
  sampleWithCode: { id: string; kanteiCode: string } | null;
  prismaClientHasKanteiCodeField: boolean;
};

/** /api/health 等での切り分け用 */
export async function getKanteiCodeDiagnostics(): Promise<KanteiCodeDiagnostics> {
  const columnExists = await kanteiCodeColumnExistsInDatabase();
  const prismaClientHasKanteiCodeField = "kanteiCode" in Prisma.OrderScalarFieldEnum;

  if (!columnExists) {
    return {
      columnExists: false,
      ordersMissingKanteiCode: null,
      ordersWithKanteiCode: null,
      sampleWithCode: null,
      prismaClientHasKanteiCodeField,
    };
  }

  const [ordersMissingKanteiCode, ordersWithKanteiCode, sampleWithCode] = await Promise.all([
    prisma.order.count({
      where: { OR: [{ kanteiCode: null }, { kanteiCode: "" }] },
    }),
    prisma.order.count({
      where: { kanteiCode: { not: null } },
    }),
    prisma.order.findFirst({
      where: { kanteiCode: { not: null } },
      select: { id: true, kanteiCode: true },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  return {
    columnExists: true,
    ordersMissingKanteiCode,
    ordersWithKanteiCode,
    sampleWithCode:
      sampleWithCode?.kanteiCode != null && sampleWithCode.kanteiCode !== ""
        ? { id: sampleWithCode.id, kanteiCode: sampleWithCode.kanteiCode }
        : null,
    prismaClientHasKanteiCodeField,
  };
}

function isPrismaUniqueViolation(err: unknown): boolean {
  return err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002";
}

function isKanteiCodeUnset(value: string | null | undefined): boolean {
  return value == null || value.trim() === "";
}

function orderWithUnsetKanteiCodeWhere(orderId: string) {
  return {
    id: orderId,
    OR: [{ kanteiCode: null }, { kanteiCode: "" }],
  };
}

/**
 * kanteiCode 付与を試みる。失敗しても例外を投げず null（ログのみ）。
 */
export async function resolveOrderKanteiCodeSafe(
  orderId: string,
  logTag = "resolveOrderKanteiCodeSafe",
): Promise<string | null> {
  try {
    return await ensureOrderKanteiCode(orderId);
  } catch (err) {
    const columnExists = await kanteiCodeColumnExistsInDatabase().catch(() => false);
    console.error(`[kanteiCode] ${logTag} failed`, {
      orderId,
      columnExists,
      error: formatKanteiCodeErrorDetail(err),
    });

    if (!columnExists) {
      console.error(
        `[kanteiCode] ${logTag}: DB column "Order.kanteiCode" is missing. Run prisma migrate deploy (repair migration).`,
        { orderId },
      );
    }

    try {
      const row = await prisma.order.findUnique({
        where: { id: orderId },
        select: { kanteiCode: true },
      });
      if (!isKanteiCodeUnset(row?.kanteiCode)) {
        return row!.kanteiCode;
      }
    } catch (readErr) {
      console.error(`[kanteiCode] ${logTag} read-back failed`, {
        orderId,
        columnExists,
        error: formatKanteiCodeErrorDetail(readErr),
      });
    }
    return null;
  }
}

/**
 * 未設定の注文に kanteiCode を付与して返す。設定済みならそのまま返す。
 */
export async function ensureOrderKanteiCode(orderId: string): Promise<string> {
  const columnExists = await kanteiCodeColumnExistsInDatabase();
  if (!columnExists) {
    throw new Error(
      'Order.kanteiCode column is missing in database (run prisma migrate deploy / repair migration)',
    );
  }

  const existing = await prisma.order.findUnique({
    where: { id: orderId },
    select: { kanteiCode: true, createdAt: true },
  });
  if (!existing) {
    throw new Error(`Order not found: ${orderId}`);
  }
  if (!isKanteiCodeUnset(existing.kanteiCode)) {
    return existing.kanteiCode as string;
  }

  for (let attempt = 0; attempt < ASSIGN_MAX_ATTEMPTS; attempt++) {
    const candidate = buildKanteiCode(existing.createdAt);
    try {
      const updated = await prisma.order.updateMany({
        where: orderWithUnsetKanteiCodeWhere(orderId),
        data: { kanteiCode: candidate },
      });
      if (updated.count === 1) {
        console.log("[kanteiCode] assigned", { orderId, kanteiCode: candidate, attempt });
        return candidate;
      }

      const raced = await prisma.order.findUnique({
        where: { id: orderId },
        select: { kanteiCode: true },
      });
      if (raced && !isKanteiCodeUnset(raced.kanteiCode)) {
        return raced.kanteiCode as string;
      }

      console.warn("[kanteiCode] updateMany count=0", {
        orderId,
        attempt,
        candidate,
        currentKanteiCode: raced?.kanteiCode ?? null,
      });
    } catch (err) {
      if (!isPrismaUniqueViolation(err)) {
        throw err;
      }
      console.warn("[kanteiCode] unique violation, retrying", {
        orderId,
        attempt,
        candidate,
        error: formatKanteiCodeErrorDetail(err),
      });
    }
  }

  throw new Error(`Failed to assign kanteiCode for order ${orderId} after ${ASSIGN_MAX_ATTEMPTS} attempts`);
}
