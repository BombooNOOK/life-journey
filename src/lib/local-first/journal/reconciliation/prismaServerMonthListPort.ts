/**
 * Optional Prisma month-list adapter (local disposable DB only).
 * Does not modify production GET /api/journal.
 */

import type { PrismaClient } from "@prisma/client";

import { assertLocalDisposableDatabaseUrl } from "@/lib/journal/saveIdempotency/assertLocalDisposableDatabaseUrl";
import { isListCapReached } from "@/lib/local-first/journal/reconciliation/journalListCaps";
import { parseUtcMonthKey } from "@/lib/local-first/journal/reconciliation/utcMonth";
import type {
  ServerMonthListPort,
  ServerMonthListResult,
} from "@/lib/local-first/journal/reconciliation/serverMonthListPort";

export function createPrismaServerMonthListPort(input: {
  prisma: PrismaClient;
  email: string;
  configuredCap: number;
  profileId?: string;
}): ServerMonthListPort {
  assertLocalDisposableDatabaseUrl(process.env.DATABASE_URL);
  return {
    async listByUtcMonth(month: string): Promise<ServerMonthListResult> {
      const range = parseUtcMonthKey(month);
      if (!range) {
        return { ok: false, month, code: "bad_month", detail: "invalid_month" };
      }
      try {
        const rows = await input.prisma.journalEntry.findMany({
          where: {
            email: input.email,
            ...(input.profileId !== undefined
              ? { profileId: input.profileId }
              : {}),
            createdAt: { gte: range.from, lt: range.to },
          },
          orderBy: { createdAt: "desc" },
          take: input.configuredCap,
          select: {
            id: true,
            createdAt: true,
            updatedAt: true,
            photoDataUrl: true,
            photoBlobUrl: true,
          },
        });
        return {
          ok: true,
          month,
          entries: rows.map((r) => ({
            id: r.id,
            createdAt: r.createdAt.toISOString(),
            updatedAt: r.updatedAt.toISOString(),
            hasPhoto: Boolean(r.photoDataUrl || r.photoBlobUrl),
          })),
          configuredCap: input.configuredCap,
          listCapReached: isListCapReached(rows.length, input.configuredCap),
        };
      } catch (error) {
        return {
          ok: false,
          month,
          code: "api_failed",
          detail: error instanceof Error ? error.message : "db_read",
        };
      }
    },
  };
}
