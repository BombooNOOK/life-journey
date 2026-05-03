import { Prisma } from "@prisma/client";

const TRANSIENT_KNOWN_CODES = new Set(["P1001", "P1002", "P1017"]);

function messageLooksTransient(msg: string): boolean {
  return /Can't reach database server|Timed out|timeout|Server has closed the connection|ECONNRESET|ETIMEDOUT|EAI_AGAIN|getaddrinfo/i.test(
    msg,
  );
}

/** Neon / serverless でたまに出る接続まわりの一時失敗 */
export function isTransientPrismaConnectionError(e: unknown): boolean {
  if (e instanceof Prisma.PrismaClientKnownRequestError) {
    return TRANSIENT_KNOWN_CODES.has(e.code);
  }
  if (e instanceof Prisma.PrismaClientInitializationError) {
    return true;
  }
  if (e instanceof Error && messageLooksTransient(e.message)) {
    return true;
  }
  return false;
}

export async function withPrismaConnectionRetry<T>(
  fn: () => Promise<T>,
  opts?: { retries?: number; baseDelayMs?: number },
): Promise<T> {
  const retries = opts?.retries ?? 2;
  const baseDelayMs = opts?.baseDelayMs ?? 400;
  let last: unknown;
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      return await fn();
    } catch (e) {
      last = e;
      if (attempt < retries && isTransientPrismaConnectionError(e)) {
        await new Promise((r) => setTimeout(r, baseDelayMs * (attempt + 1)));
        continue;
      }
      throw e;
    }
  }
  throw last;
}
