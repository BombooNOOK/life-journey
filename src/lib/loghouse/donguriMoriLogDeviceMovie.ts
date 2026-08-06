/**
 * 端末動画→森ログムービーのどんぐり確定（サーバー台帳が正）。
 * 初回: amount 0 / mori_log_device_movie_first_free
 * 2本目以降: amount -2 / mori_log_device_movie_create
 *
 * 一意制約競合時は TX 内で握りつぶさず、外側で Serializable ごと再試行する
 *（PostgreSQL はエラー後に同一 TX を続行できないため）。
 */

import { Prisma } from "@prisma/client";

import { normalizeEmail } from "@/lib/auth/viewer";
import { prisma } from "@/lib/db";
import {
  DONGURI_MORI_LOG_DEVICE_MOVIE_COST,
  DONGURI_MORI_LOG_DEVICE_MOVIE_CREATE_DESCRIPTION,
  DONGURI_MORI_LOG_DEVICE_MOVIE_CREATE_TITLE,
  DONGURI_MORI_LOG_DEVICE_MOVIE_FIRST_FREE_DATE_KEY,
  DONGURI_MORI_LOG_DEVICE_MOVIE_FIRST_FREE_DESCRIPTION,
  DONGURI_MORI_LOG_DEVICE_MOVIE_FIRST_FREE_TITLE,
} from "@/lib/loghouse/donguriTypes";

export type MoriLogDeviceMovieChargeType = "first_free" | "paid";

export type ConfirmMoriLogDeviceMovieAcornsOk = {
  ok: true;
  mediaId: string;
  chargeType: MoriLogDeviceMovieChargeType;
  amount: 0 | -2;
  balance: number;
  alreadyProcessed: boolean;
};

export type ConfirmMoriLogDeviceMovieAcornsInsufficient = {
  ok: false;
  insufficient: true;
  mediaId: string;
  balance: number;
  required: typeof DONGURI_MORI_LOG_DEVICE_MOVIE_COST;
};

export type ConfirmMoriLogDeviceMovieAcornsResult =
  | ConfirmMoriLogDeviceMovieAcornsOk
  | ConfirmMoriLogDeviceMovieAcornsInsufficient;

export function moriLogDeviceMovieIdempotencyKey(
  email: string,
  profileId: string,
  mediaId: string,
): string {
  return `mori-log-device-movie:${normalizeEmail(email)}:${profileId.trim()}:${mediaId.trim()}`;
}

export function moriLogDeviceMoviePaidDateKey(mediaId: string): string {
  return `media:${mediaId.trim()}`;
}

function chargeTypeFromReason(reason: string): MoriLogDeviceMovieChargeType {
  return reason === "mori_log_device_movie_first_free" ? "first_free" : "paid";
}

function amountFromChargeType(chargeType: MoriLogDeviceMovieChargeType): 0 | -2 {
  return chargeType === "first_free" ? 0 : -2;
}

function isUniqueViolation(e: unknown): boolean {
  return e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002";
}

function isSerializationFailure(e: unknown): boolean {
  return e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2034";
}

function isRetryableConflict(e: unknown): boolean {
  return isUniqueViolation(e) || isSerializationFailure(e);
}

async function sumBalanceTx(
  tx: Prisma.TransactionClient,
  email: string,
  profileId: string,
): Promise<number> {
  const agg = await tx.logHouseDonguriLedgerEntry.aggregate({
    where: { email, profileId },
    _sum: { amount: true },
  });
  return agg._sum.amount ?? 0;
}

async function resultFromExistingRow(
  tx: Prisma.TransactionClient,
  email: string,
  profileId: string,
  mediaId: string,
  row: { reason: string },
  alreadyProcessed: boolean,
): Promise<ConfirmMoriLogDeviceMovieAcornsOk> {
  const chargeType = chargeTypeFromReason(row.reason);
  return {
    ok: true,
    mediaId,
    chargeType,
    amount: amountFromChargeType(chargeType),
    balance: await sumBalanceTx(tx, email, profileId),
    alreadyProcessed,
  };
}

/**
 * email × profileId × mediaId で確定。同一 mediaId は1回だけ台帳処理。
 * 初回無料は (reason, dateKey=first) の一意制約で競合防止。
 */
export async function confirmMoriLogDeviceMovieAcorns(params: {
  email: string;
  profileId: string;
  mediaId: string;
}): Promise<ConfirmMoriLogDeviceMovieAcornsResult> {
  const email = normalizeEmail(params.email);
  const profileId = params.profileId.trim();
  const mediaId = params.mediaId.trim();
  if (!email || !profileId || !mediaId) {
    throw new Error("email / profileId / mediaId が必要です");
  }

  const idempotencyKey = moriLogDeviceMovieIdempotencyKey(email, profileId, mediaId);
  const maxAttempts = 5;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      return await prisma.$transaction(
        async (tx) => {
          const existing = await tx.logHouseDonguriLedgerEntry.findUnique({
            where: { idempotencyKey },
          });
          if (existing) {
            return resultFromExistingRow(tx, email, profileId, mediaId, existing, true);
          }

          const firstFreeUsed = await tx.logHouseDonguriLedgerEntry.findFirst({
            where: {
              email,
              profileId,
              reason: "mori_log_device_movie_first_free",
            },
            select: { id: true },
          });

          if (!firstFreeUsed) {
            const row = await tx.logHouseDonguriLedgerEntry.create({
              data: {
                email,
                profileId,
                amount: 0,
                reason: "mori_log_device_movie_first_free",
                title: DONGURI_MORI_LOG_DEVICE_MOVIE_FIRST_FREE_TITLE,
                description: DONGURI_MORI_LOG_DEVICE_MOVIE_FIRST_FREE_DESCRIPTION,
                dateKey: DONGURI_MORI_LOG_DEVICE_MOVIE_FIRST_FREE_DATE_KEY,
                idempotencyKey,
                createdBy: "user",
              },
            });
            return resultFromExistingRow(tx, email, profileId, mediaId, row, false);
          }

          const balance = await sumBalanceTx(tx, email, profileId);
          if (balance < DONGURI_MORI_LOG_DEVICE_MOVIE_COST) {
            return {
              ok: false as const,
              insufficient: true as const,
              mediaId,
              balance,
              required: DONGURI_MORI_LOG_DEVICE_MOVIE_COST,
            };
          }

          const row = await tx.logHouseDonguriLedgerEntry.create({
            data: {
              email,
              profileId,
              amount: -DONGURI_MORI_LOG_DEVICE_MOVIE_COST,
              reason: "mori_log_device_movie_create",
              title: DONGURI_MORI_LOG_DEVICE_MOVIE_CREATE_TITLE,
              description: DONGURI_MORI_LOG_DEVICE_MOVIE_CREATE_DESCRIPTION,
              dateKey: moriLogDeviceMoviePaidDateKey(mediaId),
              idempotencyKey,
              createdBy: "user",
            },
          });
          return resultFromExistingRow(tx, email, profileId, mediaId, row, false);
        },
        { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
      );
    } catch (e) {
      if (isRetryableConflict(e) && attempt < maxAttempts - 1) {
        continue;
      }
      throw e;
    }
  }

  throw new Error("confirmMoriLogDeviceMovieAcorns: retries exhausted");
}

export async function getMoriLogDeviceMovieDonguriStatus(params: {
  email: string;
  profileId: string;
}): Promise<{
  firstFreeAvailable: boolean;
  balance: number;
  paidCost: typeof DONGURI_MORI_LOG_DEVICE_MOVIE_COST;
}> {
  const email = normalizeEmail(params.email);
  const profileId = params.profileId.trim();
  if (!email || !profileId) {
    return {
      firstFreeAvailable: true,
      balance: 0,
      paidCost: DONGURI_MORI_LOG_DEVICE_MOVIE_COST,
    };
  }

  const [firstFree, balanceAgg] = await Promise.all([
    prisma.logHouseDonguriLedgerEntry.findFirst({
      where: { email, profileId, reason: "mori_log_device_movie_first_free" },
      select: { id: true },
    }),
    prisma.logHouseDonguriLedgerEntry.aggregate({
      where: { email, profileId },
      _sum: { amount: true },
    }),
  ]);

  return {
    firstFreeAvailable: !firstFree,
    balance: balanceAgg._sum.amount ?? 0,
    paidCost: DONGURI_MORI_LOG_DEVICE_MOVIE_COST,
  };
}
