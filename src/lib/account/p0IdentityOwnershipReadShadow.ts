/**
 * AI-X6.7B4 — P0 read-shadow set semantics (directionality-safe).
 *
 * Definitions:
 *   OLD_IDS = legacy email-authority result IDs
 *   NEW_IDS = identity-authority result IDs
 *   ONLY_OLD = OLD_IDS ∖ NEW_IDS
 *   ONLY_NEW = NEW_IDS ∖ OLD_IDS
 *   BOTH     = OLD_IDS ∩ NEW_IDS
 *
 * Per-row categories (cannot be misread):
 *   MATCH           — id ∈ BOTH
 *   LEGACY_ONLY     — id ∈ ONLY_OLD  (was NEW_MISSING: in OLD, missing from NEW)
 *   IDENTITY_ONLY   — id ∈ ONLY_NEW  (was OLD_EXTRA: in NEW, missing from OLD)
 *   OWNERSHIP_CONFLICT — same row context points to conflicting identity
 *   UNBOUND_LEGACY  — legacy row cannot safely resolve identity
 *
 * Aggregate set classification:
 *   MATCH         — ONLY_OLD=0 ∧ ONLY_NEW=0
 *   LEGACY_ONLY   — ONLY_OLD>0 ∧ ONLY_NEW=0
 *   IDENTITY_ONLY — ONLY_NEW>0 ∧ ONLY_OLD=0
 *   BOTH_DIFFER   — ONLY_OLD>0 ∧ ONLY_NEW>0
 *
 * Deprecated aliases (still accepted in tests via map):
 *   NEW_MISSING → LEGACY_ONLY
 *   OLD_EXTRA   → IDENTITY_ONLY
 */

export type P0ReadShadowCategory =
  | "MATCH"
  | "LEGACY_ONLY"
  | "IDENTITY_ONLY"
  | "OWNERSHIP_CONFLICT"
  | "UNBOUND_LEGACY";

/** @deprecated Use LEGACY_ONLY — kept as type alias documentation only */
export type P0ReadShadowCategoryLegacyAlias = "NEW_MISSING" | "OLD_EXTRA";

export type P0ReadShadowSetClassification =
  | "MATCH"
  | "LEGACY_ONLY"
  | "IDENTITY_ONLY"
  | "BOTH_DIFFER";

export type P0ReadShadowRow = {
  id: string;
  /** Present on old email-keyed result */
  inOld: boolean;
  /** Present on new identityId-keyed result */
  inNew: boolean;
  /** Row has null identityId */
  unbound: boolean;
  /** Row.identityId differs from authenticated identity */
  ownershipConflict: boolean;
};

export type P0ReadShadowSetDiff = {
  oldIds: string[];
  newIds: string[];
  onlyOld: string[];
  onlyNew: string[];
  both: string[];
  setClassification: P0ReadShadowSetClassification;
};

export function computeP0ReadShadowSetDiff(input: {
  oldIds: ReadonlyArray<string>;
  newIds: ReadonlyArray<string>;
}): P0ReadShadowSetDiff {
  const oldSet = new Set(input.oldIds);
  const newSet = new Set(input.newIds);
  const onlyOld = [...oldSet].filter((id) => !newSet.has(id)).sort();
  const onlyNew = [...newSet].filter((id) => !oldSet.has(id)).sort();
  const both = [...oldSet].filter((id) => newSet.has(id)).sort();
  let setClassification: P0ReadShadowSetClassification;
  if (onlyOld.length === 0 && onlyNew.length === 0) setClassification = "MATCH";
  else if (onlyOld.length > 0 && onlyNew.length === 0) setClassification = "LEGACY_ONLY";
  else if (onlyNew.length > 0 && onlyOld.length === 0) setClassification = "IDENTITY_ONLY";
  else setClassification = "BOTH_DIFFER";
  return {
    oldIds: [...oldSet].sort(),
    newIds: [...newSet].sort(),
    onlyOld,
    onlyNew,
    both,
    setClassification,
  };
}

export function classifyP0ReadShadowRow(row: P0ReadShadowRow): P0ReadShadowCategory {
  if (row.ownershipConflict) return "OWNERSHIP_CONFLICT";
  if (row.unbound && row.inOld && !row.inNew) return "UNBOUND_LEGACY";
  if (row.inOld && row.inNew) return "MATCH";
  if (row.inOld && !row.inNew) return "LEGACY_ONLY";
  if (!row.inOld && row.inNew) return "IDENTITY_ONLY";
  return "UNBOUND_LEGACY";
}

/**
 * Build per-row shadow comparison.
 * oldIds = email-authority; newIds = identity-authority.
 */
export function buildP0ReadShadowRows(input: {
  oldIds: ReadonlyArray<string>;
  newIds: ReadonlyArray<string>;
  unboundIds?: ReadonlySet<string>;
  conflictingIds?: ReadonlySet<string>;
}): Array<{ id: string; category: P0ReadShadowCategory }> {
  const oldSet = new Set(input.oldIds);
  const newSet = new Set(input.newIds);
  const all = new Set([...oldSet, ...newSet]);
  const unbound = input.unboundIds ?? new Set<string>();
  const conflicting = input.conflictingIds ?? new Set<string>();
  return [...all]
    .sort()
    .map((id) => {
      const row: P0ReadShadowRow = {
        id,
        inOld: oldSet.has(id),
        inNew: newSet.has(id),
        unbound: unbound.has(id),
        ownershipConflict: conflicting.has(id),
      };
      return { id, category: classifyP0ReadShadowRow(row) };
    });
}
