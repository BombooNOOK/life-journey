import { Prisma } from "@prisma/client";

import { prisma } from "@/lib/db";
import {
  clampForestResidentDisplayName,
  parseForestResidentDisplayNameInput,
} from "@/lib/forestResident/forestResidentDisplayName";

const RESIDENT_NUMBER_PREFIX = "BN-";
/** 初回サンプル BN-000802079 から 1 ずつ採番 */
const RESIDENT_NUMBER_START = 802_079;
const RESIDENT_NUMBER_DIGITS = 9;
const ASSIGN_MAX_ATTEMPTS = 8;

/** キャラ名選択実装まではサンプル名を表示 */
export const FOREST_RESIDENT_DEFAULT_DISPLAY_NAME = "森の住民" as const;

export function formatForestResidentNumber(sequence: number): string {
  return `${RESIDENT_NUMBER_PREFIX}${String(sequence).padStart(RESIDENT_NUMBER_DIGITS, "0")}`;
}

export function parseForestResidentSequence(residentNumber: string): number | null {
  const match = /^BN-(\d{9})$/.exec(residentNumber.trim());
  if (!match) return null;
  return Number.parseInt(match[1]!, 10);
}

export type ForestResidentBadge = "green" | "silver" | "gold";
export type ForestResidentFaceIcon = "rabbit";

export type ForestResidentCardData = {
  residentNumber: string;
  displayName: string;
  registeredAtLabel: string;
  faceIcon: ForestResidentFaceIcon;
  badge: ForestResidentBadge;
  issuedAt: string;
};

export function formatForestResidentRegisteredLabel(date: Date): string {
  return new Intl.DateTimeFormat("ja-JP", {
    timeZone: "Asia/Tokyo",
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(date);
}

/** 表示名（住民票専用名 → プロフィール名 → 森の住民） */
export function deriveForestResidentDisplayName(
  nickname: string | null,
  forestResidentDisplayName: string | null | undefined,
): string {
  const custom = forestResidentDisplayName?.trim() ?? "";
  if (custom) return clampForestResidentDisplayName(custom);

  const trimmedNickname = nickname?.trim() ?? "";
  if (trimmedNickname && trimmedNickname !== "メイン") {
    return clampForestResidentDisplayName(trimmedNickname);
  }
  return FOREST_RESIDENT_DEFAULT_DISPLAY_NAME;
}

async function allocateNextForestResidentNumber(): Promise<string> {
  const latest = await prisma.accountSettings.findFirst({
    where: { forestResidentNumber: { startsWith: RESIDENT_NUMBER_PREFIX } },
    orderBy: { forestResidentNumber: "desc" },
    select: { forestResidentNumber: true },
  });

  let next = RESIDENT_NUMBER_START;
  if (latest?.forestResidentNumber) {
    const parsed = parseForestResidentSequence(latest.forestResidentNumber);
    if (parsed !== null) {
      next = Math.max(RESIDENT_NUMBER_START, parsed + 1);
    }
  }

  return formatForestResidentNumber(next);
}

/** メールに紐づく住民番号を発行（既存ならそのまま返す） */
export async function ensureForestResidentForEmail(email: string): Promise<ForestResidentCardData> {
  const normalized = email.trim().toLowerCase();
  if (!normalized) throw new Error("email required");

  const existing = await prisma.accountSettings.findUnique({
    where: { email: normalized },
    select: {
      forestResidentNumber: true,
      forestResidentIssuedAt: true,
      forestResidentDisplayName: true,
      createdAt: true,
    },
  });

  if (existing?.forestResidentNumber && existing.forestResidentIssuedAt) {
    return loadForestResidentCardData(normalized, {
      forestResidentNumber: existing.forestResidentNumber,
      forestResidentIssuedAt: existing.forestResidentIssuedAt,
      forestResidentDisplayName: existing.forestResidentDisplayName,
      createdAt: existing.createdAt,
    });
  }

  const issuedAt = new Date();

  for (let attempt = 0; attempt < ASSIGN_MAX_ATTEMPTS; attempt++) {
    const forestResidentNumber = await allocateNextForestResidentNumber();
    try {
      if (existing) {
        await prisma.accountSettings.update({
          where: { email: normalized },
          data: { forestResidentNumber, forestResidentIssuedAt: issuedAt },
        });
        const updated = await prisma.accountSettings.findUniqueOrThrow({
          where: { email: normalized },
          select: {
            forestResidentNumber: true,
            forestResidentIssuedAt: true,
            forestResidentDisplayName: true,
            createdAt: true,
          },
        });
        return loadForestResidentCardData(normalized, {
          forestResidentNumber: updated.forestResidentNumber!,
          forestResidentIssuedAt: updated.forestResidentIssuedAt!,
          forestResidentDisplayName: updated.forestResidentDisplayName,
          createdAt: updated.createdAt,
        });
      }

      const created = await prisma.accountSettings.create({
        data: {
          email: normalized,
          forestResidentNumber,
          forestResidentIssuedAt: issuedAt,
          profileLimit: 1,
          isAdmin: false,
          isMonitor: false,
          subscriberPdfAccess: false,
          pdfDownloadLimitPerOrder: 2,
        },
        select: {
          forestResidentNumber: true,
          forestResidentIssuedAt: true,
          forestResidentDisplayName: true,
          createdAt: true,
        },
      });
      return loadForestResidentCardData(normalized, {
        forestResidentNumber: created.forestResidentNumber!,
        forestResidentIssuedAt: created.forestResidentIssuedAt!,
        forestResidentDisplayName: created.forestResidentDisplayName,
        createdAt: created.createdAt,
      });
    } catch (e) {
      if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
        const retry = await prisma.accountSettings.findUnique({
          where: { email: normalized },
          select: {
            forestResidentNumber: true,
            forestResidentIssuedAt: true,
            forestResidentDisplayName: true,
            createdAt: true,
          },
        });
        if (retry?.forestResidentNumber && retry.forestResidentIssuedAt) {
          return loadForestResidentCardData(normalized, {
            forestResidentNumber: retry.forestResidentNumber,
            forestResidentIssuedAt: retry.forestResidentIssuedAt,
            forestResidentDisplayName: retry.forestResidentDisplayName,
            createdAt: retry.createdAt,
          });
        }
        continue;
      }
      throw e;
    }
  }

  throw new Error("forest resident number assign failed");
}

async function loadForestResidentCardData(
  email: string,
  row: {
    forestResidentNumber: string;
    forestResidentIssuedAt: Date;
    forestResidentDisplayName: string | null;
    createdAt: Date;
  },
): Promise<ForestResidentCardData> {
  const profile = await prisma.profile.findFirst({
    where: { email, isArchived: false },
    orderBy: { createdAt: "asc" },
    select: { nickname: true },
  });

  return {
    residentNumber: row.forestResidentNumber,
    displayName: deriveForestResidentDisplayName(
      profile?.nickname ?? null,
      row.forestResidentDisplayName,
    ),
    registeredAtLabel: formatForestResidentRegisteredLabel(row.createdAt),
    faceIcon: "rabbit",
    badge: "green",
    issuedAt: row.forestResidentIssuedAt.toISOString(),
  };
}

/** 住民票のおなまえを更新（アカウント単位・最大10文字） */
export async function updateForestResidentDisplayName(
  email: string,
  rawDisplayName: unknown,
): Promise<ForestResidentCardData | { error: string }> {
  const normalized = email.trim().toLowerCase();
  if (!normalized) return { error: "email required" };

  const parsed = parseForestResidentDisplayNameInput(rawDisplayName);
  if (!parsed.ok) return { error: parsed.error };

  const account = await prisma.accountSettings.findUnique({
    where: { email: normalized },
    select: {
      forestResidentNumber: true,
      forestResidentIssuedAt: true,
      forestResidentDisplayName: true,
      createdAt: true,
    },
  });

  if (!account?.forestResidentNumber || !account.forestResidentIssuedAt) {
    return { error: "住民票がまだ発行されていません。" };
  }

  await prisma.accountSettings.update({
    where: { email: normalized },
    data: { forestResidentDisplayName: parsed.value },
  });

  return loadForestResidentCardData(normalized, {
    forestResidentNumber: account.forestResidentNumber,
    forestResidentIssuedAt: account.forestResidentIssuedAt,
    forestResidentDisplayName: parsed.value,
    createdAt: account.createdAt,
  });
}
