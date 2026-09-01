/**
 * Pure planner for future AccountSettings ↔ AccountIdentity backfill (AI-X6.5A).
 *
 * READ-ONLY classification. Does not write. Does not use current auth email
 * alone as ownership proof. Evidence must come from an explicit approved
 * identity record (identityId + optional known settings email metadata from
 * prior reconciliation), never a fresh email guess.
 */

export type AccountSettingsBindPlanInput = {
  identityId: string;
  /** Primary email already recorded on AccountIdentityEmail (approved mapping). */
  primaryEmailNormalized: string | null;
  /**
   * Existing AccountSettings candidate considered for this identity.
   * null = no candidate row supplied.
   */
  candidateSettings: {
    id: string;
    email: string;
    identityId: string | null;
  } | null;
  /**
   * Optional: another AccountSettings already bound to this identityId.
   * Used to detect already_bound / conflict without DB writes.
   */
  settingsAlreadyBoundToIdentity: {
    id: string;
    email: string;
  } | null;
};

export type AccountSettingsBindPlanState =
  | "bindable"
  | "already_bound"
  | "no_account_settings"
  | "conflicting_account_settings"
  | "ambiguous"
  | "review_required";

export type AccountSettingsBindPlanResult = {
  state: AccountSettingsBindPlanState;
  identityId: string;
  candidateSettingsId?: string;
};

/**
 * Classify whether an approved identity may bind a given AccountSettings row.
 * Never invents ownership from email alone when candidate is missing or foreign.
 */
export function planAccountSettingsIdentityBind(
  input: AccountSettingsBindPlanInput,
): AccountSettingsBindPlanResult {
  const { identityId } = input;

  if (!identityId) {
    return { state: "review_required", identityId: "" };
  }

  const already = input.settingsAlreadyBoundToIdentity;
  const candidate = input.candidateSettings;

  if (already) {
    if (candidate && candidate.id !== already.id) {
      return {
        state: "ambiguous",
        identityId,
        candidateSettingsId: candidate.id,
      };
    }
    if (candidate && candidate.identityId && candidate.identityId !== identityId) {
      return {
        state: "conflicting_account_settings",
        identityId,
        candidateSettingsId: candidate.id,
      };
    }
    return {
      state: "already_bound",
      identityId,
      candidateSettingsId: already.id,
    };
  }

  if (!candidate) {
    return { state: "no_account_settings", identityId };
  }

  if (candidate.identityId && candidate.identityId !== identityId) {
    return {
      state: "conflicting_account_settings",
      identityId,
      candidateSettingsId: candidate.id,
    };
  }

  if (candidate.identityId === identityId) {
    return {
      state: "already_bound",
      identityId,
      candidateSettingsId: candidate.id,
    };
  }

  // identityId NULL on candidate — bindable only when primary email evidence
  // matches the candidate email (approved mapping), not a free-form guess.
  const primary = input.primaryEmailNormalized;
  if (!primary || primary !== candidate.email) {
    return {
      state: "review_required",
      identityId,
      candidateSettingsId: candidate.id,
    };
  }

  return {
    state: "bindable",
    identityId,
    candidateSettingsId: candidate.id,
  };
}
