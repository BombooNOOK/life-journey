/**
 * Server month list port for create reconciliation.
 * Semantics match production GET /api/journal month filter (UTC createdAt).
 * Production route is not modified; adapters may call Prisma or inject fixtures.
 */

export type ServerJournalListEntry = {
  id: string;
  createdAt: string;
  updatedAt?: string;
  hasPhoto?: boolean;
};

export type ServerMonthListOk = {
  ok: true;
  month: string;
  entries: ServerJournalListEntry[];
  /** Cap used for this fetch (must match production take for chosen view). */
  configuredCap: number;
  listCapReached: boolean;
};

export type ServerMonthListErr = {
  ok: false;
  month: string;
  code: "api_failed" | "bad_month" | "forbidden";
  detail: string;
};

export type ServerMonthListResult = ServerMonthListOk | ServerMonthListErr;

export type ServerMonthListPort = {
  listByUtcMonth(month: string): Promise<ServerMonthListResult>;
};

export type MemoryServerEntry = ServerJournalListEntry & {
  /** UTC createdAt Date for month filtering when building lists. */
  createdAtMs: number;
};

/**
 * In-memory Server list with production-like UTC month filter + take cap.
 */
export function createMemoryServerMonthListPort(input: {
  entries: MemoryServerEntry[];
  configuredCap: number;
  /** Inject failure for specific months (S8). */
  failMonths?: Set<string> | Map<string, string>;
}): ServerMonthListPort & { entries: MemoryServerEntry[]; configuredCap: number } {
  const failMonths = input.failMonths ?? new Set<string>();
  return {
    entries: input.entries,
    configuredCap: input.configuredCap,
    async listByUtcMonth(month) {
      const failDetail =
        failMonths instanceof Map
          ? failMonths.get(month)
          : failMonths.has(month)
            ? "injected_failure"
            : null;
      if (failDetail) {
        return {
          ok: false,
          month,
          code: "api_failed",
          detail: failDetail,
        };
      }
      const m = /^(\d{4})-(\d{2})$/.exec(month);
      if (!m) {
        return { ok: false, month, code: "bad_month", detail: "invalid_month" };
      }
      const year = Number(m[1]);
      const mon = Number(m[2]);
      const fromMs = Date.UTC(year, mon - 1, 1, 0, 0, 0);
      const toMs = Date.UTC(year, mon, 1, 0, 0, 0);
      const filtered = input.entries
        .filter((e) => e.createdAtMs >= fromMs && e.createdAtMs < toMs)
        .sort((a, b) => b.createdAtMs - a.createdAtMs);
      const sliced = filtered.slice(0, input.configuredCap);
      return {
        ok: true,
        month,
        entries: sliced.map(({ id, createdAt, updatedAt, hasPhoto }) => ({
          id,
          createdAt,
          updatedAt,
          hasPhoto,
        })),
        configuredCap: input.configuredCap,
        listCapReached: sliced.length >= input.configuredCap,
      };
    },
  };
}
