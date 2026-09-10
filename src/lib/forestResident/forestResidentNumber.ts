import { Prisma } from "@prisma/client";

import {
  resolveP0IdentityOwnership,
  type P0OwnershipResolution,
  type P0OwnershipResolverDeps,
} from "@/lib/account/p0IdentityOwnership";
import { prisma } from "@/lib/db";
import { ensureWelcomeAcornGift } from "@/lib/loghouse/donguriLedger";
import {
  clampForestResidentDisplayName,
  parseForestResidentDisplayNameInput,
} from "@/lib/forestResident/forestResidentDisplayName";
import {
  FOREST_RESIDENT_DEFAULT_DISPLAY_NAME,
  type ForestResidentBadge,
  type ForestResidentCardData,
  type ForestResidentFaceIcon,
} from "@/lib/forestResident/forestResidentCardShared";

export {
  FOREST_RESIDENT_DEFAULT_DISPLAY_NAME,
  type ForestResidentBadge,
  type ForestResidentCardData,
  type ForestResidentFaceIcon,
} from "@/lib/forestResident/forestResidentCardShared";

const RESIDENT_NUMBER_PREFIX = "BN-";
/** 初回サンプル BN-000802079 から 1 ずつ採番 */
const RESIDENT_NUMBER_START = 802_079;
const RESIDENT_NUMBER_DIGITS = 9;
const ASSIGN_MAX_ATTEMPTS = 8;

export function formatForestResidentNumber(sequence: number): string {
  return `${RESIDENT_NUMBER_PREFIX}${String(sequence).padStart(RESIDENT_NUMBER_DIGITS, "0")}`;
}

export function parseForestResidentSequence(residentNumber: string): number | null {
  const match = /^BN-(\d{9})$/.exec(residentNumber.trim());
  if (!match) return null;
  return Number.parseInt(match[1]!, 10);
}

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

/**
 * AI-X6.7C1.5A2-I3.6 — Welcome gift is NOT delivered from read/GET paths.
 * Call only from authenticated mutation (e.g. POST /api/viewer/forest-resident-card).
 */
export async function deliverWelcomeAcornGiftForEmail(
  email: string,
  ownershipDeps?: Parameters<typeof ensureWelcomeAcornGift>[0]["ownershipDeps"],
): Promise<void> {
  const profile = await prisma.profile.findFirst({
    where: { email, isArchived: false },
    orderBy: { createdAt: "asc" },
    select: { id: true },
  });
  if (!profile) return;
  await ensureWelcomeAcornGift({ email, profileId: profile.id, ownershipDeps });
}

type AccountSettingsResidentRow = {
  id: string;
  email: string;
  identityId: string | null;
  forestResidentNumber: string | null;
  forestResidentIssuedAt: Date | null;
  forestResidentDisplayName: string | null;
  createdAt: Date;
};

const RESIDENT_ROW_SELECT = {
  id: true,
  email: true,
  identityId: true,
  forestResidentNumber: true,
  forestResidentIssuedAt: true,
  forestResidentDisplayName: true,
  createdAt: true,
} as const;

export type EnsureForestResidentDeps = P0OwnershipResolverDeps & {
  db?: typeof prisma;
  resolveOwnership?: () => Promise<P0OwnershipResolution>;
  /** Test seam — production uses allocateNextForestResidentNumber. */
  allocateResidentNumber?: () => Promise<string>;
};

async function allocateNextForestResidentNumber(
  db: typeof prisma = prisma,
): Promise<string> {
  const latest = await db.accountSettings.findFirst({
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

function isIssuedResidentRow(
  row: Pick<AccountSettingsResidentRow, "forestResidentNumber" | "forestResidentIssuedAt">,
): boolean {
  return Boolean(row.forestResidentNumber && row.forestResidentIssuedAt);
}

/**
 * AI-X6.7C1.5A2-I3.8 / I3.8H — Fail closed while verified UID session is
 * temporarily unavailable. Do not read or bootstrap AccountSettings / FRN
 * from email alone.
 */
export function shouldFailClosedForestResidentForTransientUnverifiedSession(
  ownership: P0OwnershipResolution,
): boolean {
  return (
    ownership.state === "UNBOUND" &&
    ownership.reason === "verified_session_required"
  );
}

/**
 * Ensure forest resident card for the viewer — identity-safe (I3.8 / I3.8H).
 *
 * Order:
 * 1. Resolve verified UID → AccountIdentity ownership
 * 2. AMBIGUOUS / MISMATCH → fail closed (null; no create / no FRN)
 * 3. UNBOUND verified_session_required → strict fail closed (null);
 *    no email lookup, no existing-row return, no create, no FRN alloc
 * 4. BOUND → AccountSettings by identityId wins (even if Profile/settings
 *    legacy email differs from session email). Never create EMAIL-B row or
 *    auto-claim null-identity email-B rows.
 * 5. identity_not_bound → legacy email bootstrap (unchanged)
 *
 * Returns null when identity authority is unavailable. Callers must tolerate
 * temporary null.
 */
export async function ensureForestResidentForEmail(
  email: string,
  deps: EnsureForestResidentDeps = {},
): Promise<ForestResidentCardData | null> {
  const normalized = email.trim().toLowerCase();
  if (!normalized) throw new Error("email required");

  const db = deps.db ?? prisma;
  const resolveOwnership =
    deps.resolveOwnership ?? (() => resolveP0IdentityOwnership(deps));
  const allocate =
    deps.allocateResidentNumber ?? (() => allocateNextForestResidentNumber(db));

  const ownership = await resolveOwnership();

  if (ownership.state === "AMBIGUOUS" || ownership.state === "MISMATCH") {
    return null;
  }

  // I3.8H: without verified UID, email alone must not authorize AccountSettings/FRN.
  if (shouldFailClosedForestResidentForTransientUnverifiedSession(ownership)) {
    return null;
  }

  if (ownership.state === "BOUND" && ownership.identityId) {
    const byIdentity = await db.accountSettings.findFirst({
      where: { identityId: ownership.identityId },
      select: RESIDENT_ROW_SELECT,
    });
    if (byIdentity && isIssuedResidentRow(byIdentity)) {
      return loadForestResidentCardData(db, byIdentity.email, byIdentity, {
        identityId: ownership.identityId,
      });
    }
    // BOUND but missing issued card: create/update with identityId — never
    // claim null-identity rows that merely share the current session email.
    return issueForestResidentForBoundIdentity({
      db,
      allocate,
      ownershipIdentityId: ownership.identityId,
      contactEmail: normalized,
      existingByIdentity: byIdentity,
    });
  }

  // True unbound (identity_not_bound) and other non-transient UNBOUND: email bootstrap.
  if (ownership.state !== "UNBOUND") {
    return null;
  }

  return issueForestResidentForEmailLegacy({
    db,
    allocate,
    email: normalized,
  });
}

async function issueForestResidentForBoundIdentity(input: {
  db: typeof prisma;
  allocate: () => Promise<string>;
  ownershipIdentityId: string;
  contactEmail: string;
  existingByIdentity: AccountSettingsResidentRow | null;
}): Promise<ForestResidentCardData | null> {
  const { db, allocate, ownershipIdentityId, contactEmail, existingByIdentity } =
    input;
  const issuedAt = new Date();

  for (let attempt = 0; attempt < ASSIGN_MAX_ATTEMPTS; attempt++) {
    const forestResidentNumber = await allocate();
    try {
      if (existingByIdentity) {
        await db.accountSettings.update({
          where: { id: existingByIdentity.id },
          data: { forestResidentNumber, forestResidentIssuedAt: issuedAt },
        });
        const updated = await db.accountSettings.findUniqueOrThrow({
          where: { id: existingByIdentity.id },
          select: RESIDENT_ROW_SELECT,
        });
        return loadForestResidentCardData(db, updated.email, updated, {
          identityId: ownershipIdentityId,
        });
      }

      const created = await db.accountSettings.create({
        data: {
          email: contactEmail,
          identityId: ownershipIdentityId,
          forestResidentNumber,
          forestResidentIssuedAt: issuedAt,
          profileLimit: 1,
          isAdmin: false,
          isMonitor: false,
          subscriberPdfAccess: false,
          pdfDownloadLimitPerOrder: 2,
        },
        select: RESIDENT_ROW_SELECT,
      });
      return loadForestResidentCardData(db, created.email, created, {
        identityId: ownershipIdentityId,
      });
    } catch (e) {
      if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
        const retryByIdentity = await db.accountSettings.findFirst({
          where: { identityId: ownershipIdentityId },
          select: RESIDENT_ROW_SELECT,
        });
        if (retryByIdentity && isIssuedResidentRow(retryByIdentity)) {
          return loadForestResidentCardData(db, retryByIdentity.email, retryByIdentity, {
            identityId: ownershipIdentityId,
          });
        }
        // Email (or FRN) collision: never auto-claim a row owned by another
        // identity or a null-identity orphan that merely shares the email.
        const byEmail = await db.accountSettings.findUnique({
          where: { email: contactEmail },
          select: RESIDENT_ROW_SELECT,
        });
        if (
          byEmail &&
          byEmail.identityId !== ownershipIdentityId
        ) {
          return null;
        }
        continue;
      }
      throw e;
    }
  }

  throw new Error("forest resident number assign failed");
}

async function issueForestResidentForEmailLegacy(input: {
  db: typeof prisma;
  allocate: () => Promise<string>;
  email: string;
}): Promise<ForestResidentCardData> {
  const { db, allocate, email } = input;
  const existing = await db.accountSettings.findUnique({
    where: { email },
    select: RESIDENT_ROW_SELECT,
  });

  if (existing && isIssuedResidentRow(existing)) {
    return loadForestResidentCardData(db, existing.email, existing, {
      identityId: existing.identityId,
    });
  }

  const issuedAt = new Date();

  for (let attempt = 0; attempt < ASSIGN_MAX_ATTEMPTS; attempt++) {
    const forestResidentNumber = await allocate();
    try {
      if (existing) {
        await db.accountSettings.update({
          where: { email },
          data: { forestResidentNumber, forestResidentIssuedAt: issuedAt },
        });
        const updated = await db.accountSettings.findUniqueOrThrow({
          where: { email },
          select: RESIDENT_ROW_SELECT,
        });
        return loadForestResidentCardData(db, updated.email, updated, {
          identityId: updated.identityId,
        });
      }

      // True unbound bootstrap: identityId remains null (no invent).
      const created = await db.accountSettings.create({
        data: {
          email,
          forestResidentNumber,
          forestResidentIssuedAt: issuedAt,
          profileLimit: 1,
          isAdmin: false,
          isMonitor: false,
          subscriberPdfAccess: false,
          pdfDownloadLimitPerOrder: 2,
        },
        select: RESIDENT_ROW_SELECT,
      });
      return loadForestResidentCardData(db, created.email, created, {
        identityId: created.identityId,
      });
    } catch (e) {
      if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
        const retry = await db.accountSettings.findUnique({
          where: { email },
          select: RESIDENT_ROW_SELECT,
        });
        if (retry && isIssuedResidentRow(retry)) {
          return loadForestResidentCardData(db, retry.email, retry, {
            identityId: retry.identityId,
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
  db: typeof prisma,
  contactEmail: string,
  row: {
    forestResidentNumber: string | null;
    forestResidentIssuedAt: Date | null;
    forestResidentDisplayName: string | null;
    createdAt: Date;
  },
  opts: { identityId?: string | null } = {},
): Promise<ForestResidentCardData> {
  const profile = opts.identityId
    ? await db.profile.findFirst({
        where: { identityId: opts.identityId, isArchived: false },
        orderBy: { createdAt: "asc" },
        select: { nickname: true },
      })
    : await db.profile.findFirst({
        where: { email: contactEmail, isArchived: false },
        orderBy: { createdAt: "asc" },
        select: { nickname: true },
      });

  return {
    residentNumber: row.forestResidentNumber!,
    displayName: deriveForestResidentDisplayName(
      profile?.nickname ?? null,
      row.forestResidentDisplayName,
    ),
    registeredAtLabel: formatForestResidentRegisteredLabel(row.createdAt),
    faceIcon: "rabbit",
    badge: "green",
    issuedAt: row.forestResidentIssuedAt!.toISOString(),
  };
}

/** 住民票のおなまえを更新（アカウント単位・最大7文字） */
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
    select: RESIDENT_ROW_SELECT,
  });

  if (!account?.forestResidentNumber || !account.forestResidentIssuedAt) {
    return { error: "住民票がまだ発行されていません。" };
  }

  await prisma.accountSettings.update({
    where: { email: normalized },
    data: { forestResidentDisplayName: parsed.value },
  });

  return loadForestResidentCardData(
    prisma,
    account.email,
    {
      ...account,
      forestResidentDisplayName: parsed.value,
    },
    { identityId: account.identityId },
  );
}
