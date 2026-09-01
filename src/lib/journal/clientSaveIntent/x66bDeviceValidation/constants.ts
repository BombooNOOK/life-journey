/**
 * Dev-only X6.6B company-SE3 autorun validation harness constants.
 * Not a product surface. Default OFF.
 */

export const X66B_DEVICE_VALIDATION_AUTORUN_FLAG =
  "NEXT_PUBLIC_LJD_X6_DEVICE_VALIDATION_AUTORUN" as const;

export const X66B_DEVICE_VALIDATION_AUTORUN_FLAG_VALUE = "YES" as const;

export const X66B_EVIDENCE_STORAGE_KEY = "ljd_x66b_device_validation_evidence_v1" as const;

export const X66B_VALIDATION_DRAFT_REF = "x66b_device_validation_autorun" as const;

/** Minimal journal payload body — not a user diary entry. */
export const X66B_VALIDATION_CONTENT =
  "[x66b-device-validation] controlled pending-intent probe" as const;
