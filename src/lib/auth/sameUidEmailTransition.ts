/**
 * AI-X6.7C1.5A2-I2 — Same Firebase UID AccountIdentityEmail transition.
 *
 * Authority: verified Firebase UID → AccountIdentity only.
 * Current session email alone NEVER authorizes historical ownership.
 * Client-supplied newEmail is NEVER authoritative.
 *
 * Transaction order (canonical):
 *   validate → retire old primary → establish/reactivate new primary → commit
 *
 * Never writes LegacyActorClaim or product legacy email columns.
 */

import { Prisma } from "@prisma/client";

import { ACCOUNT_IDENTITY_EMAIL_STATUS } from "@/lib/auth/accountIdentityEmailStatus";
import { isIdentityBindingEnabled } from "@/lib/auth/identityBindingGate";
import { isSameUidEmailTransitionEnabled } from "@/lib/auth/sameUidEmailTransitionGate";
import { isVerifiedAuthSessionEnabled } from "@/lib/auth/verifiedAuthSessionGate";
import {
  getVerifiedViewerSession,
  type VerifiedViewerSession,
} from "@/lib/auth/verifiedSession";
import { normalizeEmail } from "@/lib/auth/viewer";
import { prisma as defaultPrisma } from "@/lib/db";

export type SameUidEmailTransitionState =
  | "disabled"
  | "verified_session_required"
  | "invalid_request"
  | "transitioned"
  | "already_current"
  | "old_email_mismatch"
  | "new_email_primary_conflict"
  | "stale_transition"
  | "ambiguous_identity_state"
  | "identity_not_bound"
  | "conflict";

export type SameUidEmailTransitionResult = {
  state: SameUidEmailTransitionState;
  /** Internal only — never expose in public API responses. */
  identityId?: string;
};

export type SameUidEmailTransitionDb = {
  $transaction: typeof defaultPrisma.$transaction;
  accountIdentity: {
    findUnique: typeof defaultPrisma.accountIdentity.findUnique;
  };
  accountIdentityEmail: {
    findMany: typeof defaultPrisma.accountIdentityEmail.findMany;
    findFirst: typeof defaultPrisma.accountIdentityEmail.findFirst;
    create: typeof defaultPrisma.accountIdentityEmail.create;
    update: typeof defaultPrisma.accountIdentityEmail.update;
  };
  accountIdentityLegacyActorClaim: {
    count: typeof defaultPrisma.accountIdentityLegacyActorClaim.count;
  };
  $queryRaw: typeof defaultPrisma.$queryRaw;
};

export type SameUidEmailTransitionDeps = {
  getSession?: () => Promise<VerifiedViewerSession | null>;
  isVerifiedAuthEnabled?: () => boolean;
  isBindingEnabled?: () => boolean;
  isTransitionEnabled?: () => boolean;
  db?: SameUidEmailTransitionDb;
};

type EmailRow = {
  id: string;
  emailNormalized: string;
  status: string;
  boundAt: Date;
  retiredAt: Date | null;
};

function isUniqueConflict(error: unknown): boolean {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002"
  );
}

/**
 * Immediately previous primary = retired row with greatest retiredAt.
 * Tie on retiredAt → ambiguous (fail closed).
 */
export function findLatestRetiredEmail(
  rows: ReadonlyArray<EmailRow>,
): { kind: "ok"; row: EmailRow } | { kind: "none" } | { kind: "ambiguous" } {
  const retired = rows.filter(
    (r) =>
      r.status === ACCOUNT_IDENTITY_EMAIL_STATUS.retired && r.retiredAt != null,
  );
  if (retired.length === 0) return { kind: "none" };
  let maxMs = -1;
  for (const r of retired) {
    const ms = r.retiredAt!.getTime();
    if (ms > maxMs) maxMs = ms;
  }
  const top = retired.filter((r) => r.retiredAt!.getTime() === maxMs);
  if (top.length !== 1) return { kind: "ambiguous" };
  return { kind: "ok", row: top[0]! };
}

export function evaluateAlreadyCurrentStrictII(input: {
  primary: EmailRow;
  sessionEmail: string;
  expectedPreviousEmail: string;
  rows: ReadonlyArray<EmailRow>;
}): SameUidEmailTransitionState | null {
  const { primary, sessionEmail, expectedPreviousEmail, rows } = input;
  if (primary.emailNormalized !== sessionEmail) return null;

  // E1: clean already current (expected == primary == session)
  if (expectedPreviousEmail === primary.emailNormalized) {
    return "already_current";
  }

  // E2: exact transition retry — expected is immediately previous primary
  const latest = findLatestRetiredEmail(rows);
  if (latest.kind === "ambiguous") return "ambiguous_identity_state";
  if (latest.kind === "none") return "stale_transition";
  if (latest.row.emailNormalized !== expectedPreviousEmail) {
    return "stale_transition";
  }
  return "already_current";
}

async function classifyUniqueRace(
  db: SameUidEmailTransitionDb,
  identityId: string,
  newEmail: string,
): Promise<SameUidEmailTransitionState> {
  const foreignPrimary = await db.accountIdentityEmail.findFirst({
    where: {
      emailNormalized: newEmail,
      status: ACCOUNT_IDENTITY_EMAIL_STATUS.primary,
      NOT: { identityId },
    },
    select: { id: true },
  });
  if (foreignPrimary) return "new_email_primary_conflict";
  return "conflict";
}

/**
 * Perform same-UID email transition under verified session authority.
 */
export async function runSameUidEmailTransition(
  input: { expectedPreviousEmail: string },
  deps: SameUidEmailTransitionDeps = {},
): Promise<SameUidEmailTransitionResult> {
  const isVerifiedAuthEnabled =
    deps.isVerifiedAuthEnabled ?? (() => isVerifiedAuthSessionEnabled());
  const isBindingEnabled =
    deps.isBindingEnabled ?? (() => isIdentityBindingEnabled());
  const isTransitionEnabled =
    deps.isTransitionEnabled ?? (() => isSameUidEmailTransitionEnabled());
  const getSession = deps.getSession ?? getVerifiedViewerSession;
  const db = deps.db ?? defaultPrisma;

  if (
    !isVerifiedAuthEnabled() ||
    !isBindingEnabled() ||
    !isTransitionEnabled()
  ) {
    return { state: "disabled" };
  }

  const session = await getSession();
  if (!session?.uid) {
    return { state: "verified_session_required" };
  }
  const newEmail = normalizeEmail(session.email);
  if (!newEmail) {
    return { state: "verified_session_required" };
  }
  const oldExpected = normalizeEmail(input.expectedPreviousEmail);
  if (!oldExpected) {
    return { state: "invalid_request" };
  }

  const firebaseUid = session.uid;

  try {
    return await db.$transaction(async (tx) => {
      // Row lock AccountIdentity by firebaseUid (parameterized).
      const locked = await tx.$queryRaw<Array<{ id: string; firebaseUid: string }>>`
        SELECT id, "firebaseUid"
        FROM "AccountIdentity"
        WHERE "firebaseUid" = ${firebaseUid}
        FOR UPDATE
      `;
      if (locked.length === 0) {
        return { state: "identity_not_bound" as const };
      }
      if (locked.length !== 1) {
        return { state: "ambiguous_identity_state" as const };
      }
      const identity = locked[0]!;
      if (identity.firebaseUid !== firebaseUid) {
        return { state: "ambiguous_identity_state" as const };
      }
      const identityId = identity.id;

      const rows = (await tx.accountIdentityEmail.findMany({
        where: { identityId },
        select: {
          id: true,
          emailNormalized: true,
          status: true,
          boundAt: true,
          retiredAt: true,
        },
      })) as EmailRow[];

      const primaries = rows.filter(
        (r) => r.status === ACCOUNT_IDENTITY_EMAIL_STATUS.primary,
      );
      if (primaries.length > 1) {
        return {
          state: "ambiguous_identity_state" as const,
          identityId,
        };
      }
      if (primaries.length === 0) {
        return {
          state: "ambiguous_identity_state" as const,
          identityId,
        };
      }
      const primary = primaries[0]!;

      const idempotent = evaluateAlreadyCurrentStrictII({
        primary,
        sessionEmail: newEmail,
        expectedPreviousEmail: oldExpected,
        rows,
      });
      if (idempotent === "already_current") {
        return { state: "already_current" as const, identityId };
      }
      if (
        idempotent === "stale_transition" ||
        idempotent === "ambiguous_identity_state"
      ) {
        return { state: idempotent, identityId };
      }

      if (primary.emailNormalized !== oldExpected) {
        return { state: "old_email_mismatch" as const, identityId };
      }
      if (newEmail === oldExpected) {
        // Session equals old primary but idempotent branch did not fire → invalid
        return { state: "invalid_request" as const, identityId };
      }

      const foreignPrimary = await tx.accountIdentityEmail.findFirst({
        where: {
          emailNormalized: newEmail,
          status: ACCOUNT_IDENTITY_EMAIL_STATUS.primary,
          NOT: { identityId },
        },
        select: { id: true },
      });
      if (foreignPrimary) {
        return { state: "new_email_primary_conflict" as const, identityId };
      }

      const sameNew = rows.find((r) => r.emailNormalized === newEmail);
      if (
        sameNew &&
        sameNew.status === ACCOUNT_IDENTITY_EMAIL_STATUS.primary
      ) {
        // Should have been caught by idempotent; defensive
        return { state: "already_current" as const, identityId };
      }

      // 1) Retire old primary first
      await tx.accountIdentityEmail.update({
        where: { id: primary.id },
        data: {
          status: ACCOUNT_IDENTITY_EMAIL_STATUS.retired,
          retiredAt: new Date(),
        },
      });

      // 2) Establish / reactivate new primary
      if (!sameNew) {
        await tx.accountIdentityEmail.create({
          data: {
            identityId,
            emailNormalized: newEmail,
            status: ACCOUNT_IDENTITY_EMAIL_STATUS.primary,
          },
        });
      } else if (sameNew.status === ACCOUNT_IDENTITY_EMAIL_STATUS.retired) {
        await tx.accountIdentityEmail.update({
          where: { id: sameNew.id },
          data: {
            status: ACCOUNT_IDENTITY_EMAIL_STATUS.primary,
            retiredAt: null,
            boundAt: new Date(),
          },
        });
      } else {
        return { state: "ambiguous_identity_state" as const, identityId };
      }

      return { state: "transitioned" as const, identityId };
    });
  } catch (error) {
    if (!isUniqueConflict(error)) {
      throw error;
    }
    // Unique race: never convert to success. Prefer primary-conflict when classifiable.
    const identity = await db.accountIdentity.findUnique({
      where: { firebaseUid },
      select: { id: true },
    });
    if (identity) {
      const state = await classifyUniqueRace(db, identity.id, newEmail);
      return { state, identityId: identity.id };
    }
    return { state: "conflict" };
  }
}

export function toPublicSameUidEmailTransitionResponse(
  result: SameUidEmailTransitionResult,
): { code: string; state: SameUidEmailTransitionState; status: number } {
  switch (result.state) {
    case "transitioned":
      return { code: "ok", state: "transitioned", status: 200 };
    case "already_current":
      return { code: "ok", state: "already_current", status: 200 };
    case "old_email_mismatch":
      return { code: "old_email_mismatch", state: "old_email_mismatch", status: 409 };
    case "new_email_primary_conflict":
      return {
        code: "new_email_primary_conflict",
        state: "new_email_primary_conflict",
        status: 409,
      };
    case "stale_transition":
      return { code: "stale_transition", state: "stale_transition", status: 409 };
    case "ambiguous_identity_state":
      return {
        code: "ambiguous_identity_state",
        state: "ambiguous_identity_state",
        status: 409,
      };
    case "identity_not_bound":
      return {
        code: "identity_not_bound",
        state: "identity_not_bound",
        status: 409,
      };
    case "conflict":
      return { code: "conflict", state: "conflict", status: 409 };
    case "invalid_request":
      return { code: "invalid_request", state: "invalid_request", status: 400 };
    case "verified_session_required":
      return {
        code: "verified_session_required",
        state: "verified_session_required",
        status: 401,
      };
    case "disabled":
    default:
      return { code: "disabled", state: "disabled", status: 503 };
  }
}
