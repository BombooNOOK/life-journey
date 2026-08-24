/**
 * Verified AccountIdentity self-binding (AI-8.3a).
 *
 * Current verified email proves current Firebase Auth ownership only.
 * Historical legacy actor ownership requires approved reconciliation /
 * pre-cutover snapshot — this helper NEVER writes LegacyActorClaim.
 *
 * Authority: getVerifiedViewerSession() only (uid + normalized email).
 * Never trusts request body, legacy lj_user_email, or client-supplied ids.
 */

import { Prisma } from "@prisma/client";

import { ACCOUNT_IDENTITY_EMAIL_STATUS } from "@/lib/auth/accountIdentityEmailStatus";
import { isIdentityBindingEnabled } from "@/lib/auth/identityBindingGate";
import { isVerifiedAuthSessionEnabled } from "@/lib/auth/verifiedAuthSessionGate";
import {
  getVerifiedViewerSession,
  type VerifiedViewerSession,
} from "@/lib/auth/verifiedSession";
import { normalizeEmail } from "@/lib/auth/viewer";
import { prisma as defaultPrisma } from "@/lib/db";

export type IdentityBindingState =
  | "disabled"
  | "verified_session_required"
  | "created"
  | "match"
  | "email_mismatch"
  | "incomplete_identity"
  | "needs_operator_review";

export type EnsureVerifiedAccountIdentityResult = {
  state: IdentityBindingState;
  /** Internal only — never expose in public diagnostic responses. */
  identityId?: string;
};

/** Minimal Prisma surface for tests; production uses the shared client. */
export type IdentityBindingDb = {
  $transaction: typeof defaultPrisma.$transaction;
  accountIdentity: {
    findUnique: typeof defaultPrisma.accountIdentity.findUnique;
    create: typeof defaultPrisma.accountIdentity.create;
  };
};

export type EnsureVerifiedAccountIdentityDeps = {
  getSession?: () => Promise<VerifiedViewerSession | null>;
  isVerifiedAuthEnabled?: () => boolean;
  isBindingEnabled?: () => boolean;
  db?: IdentityBindingDb;
};

function isUniqueConflict(error: unknown): boolean {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002"
  );
}

async function loadIdentityByUid(db: IdentityBindingDb, firebaseUid: string) {
  return db.accountIdentity.findUnique({
    where: { firebaseUid },
    include: {
      emails: {
        where: { status: ACCOUNT_IDENTITY_EMAIL_STATUS.primary },
        select: {
          id: true,
          emailNormalized: true,
          status: true,
        },
      },
    },
  });
}

function evaluateExisting(
  identity: NonNullable<Awaited<ReturnType<typeof loadIdentityByUid>>>,
  verifiedEmail: string,
): EnsureVerifiedAccountIdentityResult {
  const primaries = identity.emails;
  if (primaries.length === 0) {
    return { state: "incomplete_identity", identityId: identity.id };
  }
  if (primaries.length > 1) {
    return { state: "needs_operator_review", identityId: identity.id };
  }
  const primary = primaries[0]!;
  if (primary.emailNormalized === verifiedEmail) {
    return { state: "match", identityId: identity.id };
  }
  // Gate X6 OPEN: do not retire/insert/remap/claim on email mismatch.
  return { state: "email_mismatch", identityId: identity.id };
}

/**
 * Upsert-or-observe AccountIdentity + primary AccountIdentityEmail for the
 * verified Firebase session. Never creates LegacyActorClaim.
 */
export async function ensureVerifiedAccountIdentity(
  deps: EnsureVerifiedAccountIdentityDeps = {},
): Promise<EnsureVerifiedAccountIdentityResult> {
  const isVerifiedAuthEnabled =
    deps.isVerifiedAuthEnabled ?? (() => isVerifiedAuthSessionEnabled());
  const isBindingEnabled = deps.isBindingEnabled ?? (() => isIdentityBindingEnabled());
  const getSession = deps.getSession ?? getVerifiedViewerSession;
  const db = deps.db ?? defaultPrisma;

  if (!isVerifiedAuthEnabled() || !isBindingEnabled()) {
    return { state: "disabled" };
  }

  const session = await getSession();
  if (!session?.uid) {
    return { state: "verified_session_required" };
  }
  const verifiedEmail = normalizeEmail(session.email);
  if (!verifiedEmail) {
    return { state: "verified_session_required" };
  }
  const firebaseUid = session.uid;

  const existing = await loadIdentityByUid(db, firebaseUid);
  if (existing) {
    return evaluateExisting(existing, verifiedEmail);
  }

  try {
    const created = await db.$transaction(async (tx) => {
      const raced = await tx.accountIdentity.findUnique({
        where: { firebaseUid },
        include: {
          emails: {
            where: { status: ACCOUNT_IDENTITY_EMAIL_STATUS.primary },
            select: { id: true, emailNormalized: true, status: true },
          },
        },
      });
      if (raced) {
        return { kind: "existing" as const, identity: raced };
      }

      const identity = await tx.accountIdentity.create({
        data: {
          firebaseUid,
          emails: {
            create: {
              emailNormalized: verifiedEmail,
              status: ACCOUNT_IDENTITY_EMAIL_STATUS.primary,
            },
          },
        },
        select: { id: true },
      });
      return { kind: "created" as const, identityId: identity.id };
    });

    if (created.kind === "created") {
      return { state: "created", identityId: created.identityId };
    }
    return evaluateExisting(created.identity, verifiedEmail);
  } catch (error) {
    if (!isUniqueConflict(error)) {
      throw error;
    }
    const afterRace = await loadIdentityByUid(db, firebaseUid);
    if (!afterRace) {
      return { state: "needs_operator_review" };
    }
    return evaluateExisting(afterRace, verifiedEmail);
  }
}

export function toPublicIdentityBindingResponse(
  result: EnsureVerifiedAccountIdentityResult,
): { code: string; state: IdentityBindingState; status: number } {
  switch (result.state) {
    case "created":
      return { code: "ok", state: "created", status: 200 };
    case "match":
      return { code: "ok", state: "match", status: 200 };
    case "email_mismatch":
      return { code: "review_required", state: "email_mismatch", status: 409 };
    case "incomplete_identity":
      return { code: "review_required", state: "incomplete_identity", status: 409 };
    case "needs_operator_review":
      return { code: "review_required", state: "needs_operator_review", status: 409 };
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
