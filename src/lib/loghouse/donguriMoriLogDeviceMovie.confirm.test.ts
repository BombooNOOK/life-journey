import { beforeEach, describe, expect, it, vi } from "vitest";

const txState = vi.hoisted(() => ({
  rows: [] as Array<{
    id: string;
    email: string;
    profileId: string;
    amount: number;
    reason: string;
    dateKey: string | null;
    idempotencyKey: string | null;
  }>,
}));

vi.mock("@/lib/db", () => {
  function findUnique(args: { where: { idempotencyKey: string } }) {
    return (
      txState.rows.find((r) => r.idempotencyKey === args.where.idempotencyKey) ?? null
    );
  }
  function findFirst(args: {
    where: { email: string; profileId: string; reason: string };
  }) {
    return (
      txState.rows.find(
        (r) =>
          r.email === args.where.email &&
          r.profileId === args.where.profileId &&
          r.reason === args.where.reason,
      ) ?? null
    );
  }
  async function create(args: {
    data: {
      email: string;
      profileId: string;
      amount: number;
      reason: string;
      dateKey: string | null;
      idempotencyKey: string | null;
    };
  }) {
    const { Prisma } = await import("@prisma/client");
    if (
      txState.rows.some((r) => r.idempotencyKey && r.idempotencyKey === args.data.idempotencyKey)
    ) {
      throw new Prisma.PrismaClientKnownRequestError("Unique", {
        code: "P2002",
        clientVersion: "test",
      });
    }
    if (
      args.data.reason === "mori_log_device_movie_first_free" &&
      txState.rows.some(
        (r) =>
          r.email === args.data.email &&
          r.profileId === args.data.profileId &&
          r.reason === "mori_log_device_movie_first_free",
      )
    ) {
      throw new Prisma.PrismaClientKnownRequestError("Unique", {
        code: "P2002",
        clientVersion: "test",
      });
    }
    const row = {
      id: `id-${txState.rows.length + 1}`,
      ...args.data,
    };
    txState.rows.push(row);
    return row;
  }
  async function aggregate(args: { where: { email: string; profileId: string } }) {
    const sum = txState.rows
      .filter((r) => r.email === args.where.email && r.profileId === args.where.profileId)
      .reduce((acc, r) => acc + r.amount, 0);
    return { _sum: { amount: sum } };
  }

  const tx = {
    logHouseDonguriLedgerEntry: {
      findUnique,
      findFirst,
      create,
      aggregate,
    },
  };

  return {
    prisma: {
      $transaction: async (
        fn: (client: typeof tx) => Promise<unknown>,
        _opts?: unknown,
      ) => fn(tx),
      logHouseDonguriLedgerEntry: {
        findFirst,
        aggregate,
      },
    },
  };
});

import { confirmMoriLogDeviceMovieAcorns } from "@/lib/loghouse/donguriMoriLogDeviceMovie";

describe("confirmMoriLogDeviceMovieAcorns", () => {
  beforeEach(() => {
    txState.rows = [
      {
        id: "grant",
        email: "a@example.com",
        profileId: "p1",
        amount: 10,
        reason: "admin_grant",
        dateKey: "g1",
        idempotencyKey: null,
      },
    ];
  });

  it("first confirm is free (amount 0)", async () => {
    const r = await confirmMoriLogDeviceMovieAcorns({
      email: "a@example.com",
      profileId: "p1",
      mediaId: "m1",
    });
    expect(r).toMatchObject({
      ok: true,
      chargeType: "first_free",
      amount: 0,
      alreadyProcessed: false,
      balance: 10,
    });
  });

  it("second media is paid (-2) and updates balance", async () => {
    await confirmMoriLogDeviceMovieAcorns({
      email: "a@example.com",
      profileId: "p1",
      mediaId: "m1",
    });
    const r = await confirmMoriLogDeviceMovieAcorns({
      email: "a@example.com",
      profileId: "p1",
      mediaId: "m2",
    });
    expect(r).toMatchObject({
      ok: true,
      chargeType: "paid",
      amount: -2,
      alreadyProcessed: false,
      balance: 8,
    });
  });

  it("same mediaId is idempotent", async () => {
    const first = await confirmMoriLogDeviceMovieAcorns({
      email: "a@example.com",
      profileId: "p1",
      mediaId: "m1",
    });
    const second = await confirmMoriLogDeviceMovieAcorns({
      email: "a@example.com",
      profileId: "p1",
      mediaId: "m1",
    });
    expect(first).toMatchObject({ ok: true, alreadyProcessed: false });
    expect(second).toMatchObject({
      ok: true,
      alreadyProcessed: true,
      chargeType: "first_free",
      amount: 0,
      balance: 10,
    });
    expect(txState.rows.filter((r) => r.reason.startsWith("mori_log")).length).toBe(1);
  });

  it("returns insufficient when paid and balance < 2", async () => {
    txState.rows = [
      {
        id: "grant",
        email: "a@example.com",
        profileId: "p1",
        amount: 1,
        reason: "admin_grant",
        dateKey: "g1",
        idempotencyKey: null,
      },
    ];
    await confirmMoriLogDeviceMovieAcorns({
      email: "a@example.com",
      profileId: "p1",
      mediaId: "m1",
    });
    const r = await confirmMoriLogDeviceMovieAcorns({
      email: "a@example.com",
      profileId: "p1",
      mediaId: "m2",
    });
    expect(r).toMatchObject({
      ok: false,
      insufficient: true,
      balance: 1,
      required: 2,
    });
    expect(txState.rows.filter((r) => r.reason === "mori_log_device_movie_create").length).toBe(
      0,
    );
  });

  it("prevents two first_free across media via unique reason", async () => {
    await confirmMoriLogDeviceMovieAcorns({
      email: "a@example.com",
      profileId: "p1",
      mediaId: "m1",
    });
    // Force race-like: drop firstFree lookup by clearing? Already exists.
    const r = await confirmMoriLogDeviceMovieAcorns({
      email: "a@example.com",
      profileId: "p1",
      mediaId: "m2",
    });
    expect(r).toMatchObject({ ok: true, chargeType: "paid" });
    expect(
      txState.rows.filter((r) => r.reason === "mori_log_device_movie_first_free").length,
    ).toBe(1);
  });
});
