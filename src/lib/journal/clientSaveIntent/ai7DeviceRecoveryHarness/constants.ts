/**
 * Isolated AI-7 native recovery harness identity.
 * Never a real user email. Never used by product journal save.
 */

export const AI7_DEVICE_RECOVERY_TEST_ACTOR =
  "ai7-device-recovery-test@ljd.invalid" as const;

export const AI7_DEVICE_HARNESS_FLAG = "NEXT_PUBLIC_AI7_DEVICE_HARNESS" as const;
export const AI7_DEVICE_HARNESS_FLAG_VALUE = "YES" as const;

/** Stable namespace ids so kill/relaunch can find the same SQLCipher rows. */
export const AI7_TEXT_SAVE_OPERATION_ID = "ai7dev_text_testop_000001" as const;
export const AI7_PHOTO_SAVE_OPERATION_ID = "ai7dev_photo_testop_00001" as const;

export const AI7_TEST_PROFILE_ID = "ai7_test_profile_isolated" as const;
export const AI7_TEST_DRAFT_REF = "ai7_device_recovery_harness" as const;
