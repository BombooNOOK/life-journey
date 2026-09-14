import { PrismaClient } from "@prisma/client";

import {
  isAccountSettingsWriteTraceEnabled,
  tracePrismaAccountSettingsWrite,
  type AccountSettingsWriteOp,
} from "@/lib/observability/accountSettingsWriteTrace";

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

function createPrismaClient(): PrismaClient {
  const base = new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });

  // Trace is opt-in. Extension is always attached but no-ops when gate OFF
  // so typing stays PrismaClient via cast (query semantics unchanged).
  const extended = base.$extends({
    query: {
      accountSettings: {
        async create({ args, query }) {
          if (isAccountSettingsWriteTraceEnabled()) {
            tracePrismaAccountSettingsWrite({
              operation: "create",
              args,
            });
          }
          return query(args);
        },
        async update({ args, query }) {
          if (isAccountSettingsWriteTraceEnabled()) {
            tracePrismaAccountSettingsWrite({
              operation: "update",
              args,
            });
          }
          return query(args);
        },
        async upsert({ args, query }) {
          if (isAccountSettingsWriteTraceEnabled()) {
            tracePrismaAccountSettingsWrite({
              operation: "upsert",
              args,
            });
          }
          return query(args);
        },
        async updateMany({ args, query }) {
          if (isAccountSettingsWriteTraceEnabled()) {
            tracePrismaAccountSettingsWrite({
              operation: "updateMany" satisfies AccountSettingsWriteOp,
              args,
            });
          }
          return query(args);
        },
        async delete({ args, query }) {
          if (isAccountSettingsWriteTraceEnabled()) {
            tracePrismaAccountSettingsWrite({
              operation: "delete",
              args,
            });
          }
          return query(args);
        },
        async deleteMany({ args, query }) {
          if (isAccountSettingsWriteTraceEnabled()) {
            tracePrismaAccountSettingsWrite({
              operation: "deleteMany",
              args,
            });
          }
          return query(args);
        },
      },
    },
  });

  // Preserve existing import type surface (`PrismaClient`) for the codebase.
  return extended as unknown as PrismaClient;
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
