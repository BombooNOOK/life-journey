import {
  AI7_DEVICE_HARNESS_FLAG,
  AI7_DEVICE_HARNESS_FLAG_VALUE,
} from "@/lib/journal/clientSaveIntent/ai7DeviceRecoveryHarness/constants";

export type Ai7DeviceRecoveryHarnessGateInput = {
  nodeEnv?: string | undefined;
  flag?: string | undefined;
  isNativePlatform?: boolean | undefined;
};

export type Ai7DeviceRecoveryHarnessGateResult = {
  ok: boolean;
  reason:
    | "ok"
    | "production_build"
    | "flag_off"
    | "not_native"
    | "ok_page_web_disabled";
  pageAllowed: boolean;
  operationsAllowed: boolean;
};

/**
 * Development/test + explicit flag. Production Next/Vercel builds set
 * NODE_ENV=production, so the harness is structurally unavailable there.
 * Native is required for persist/recover/cleanup, not for the 404 gate.
 */
export function evaluateAi7DeviceRecoveryHarnessGate(
  input: Ai7DeviceRecoveryHarnessGateInput = {},
): Ai7DeviceRecoveryHarnessGateResult {
  const nodeEnv = (input.nodeEnv ?? process.env.NODE_ENV ?? "").trim();
  const flag = (
    input.flag ?? process.env[AI7_DEVICE_HARNESS_FLAG] ?? ""
  ).trim();
  const isNative = input.isNativePlatform === true;
  const nodeEnvOk = nodeEnv !== "production";
  const flagOk = flag === AI7_DEVICE_HARNESS_FLAG_VALUE;

  if (!nodeEnvOk) {
    return {
      ok: false,
      reason: "production_build",
      pageAllowed: false,
      operationsAllowed: false,
    };
  }
  if (!flagOk) {
    return {
      ok: false,
      reason: "flag_off",
      pageAllowed: false,
      operationsAllowed: false,
    };
  }
  if (!isNative) {
    return {
      ok: false,
      reason: "not_native",
      pageAllowed: true,
      operationsAllowed: false,
    };
  }
  return {
    ok: true,
    reason: "ok",
    pageAllowed: true,
    operationsAllowed: true,
  };
}

export function isAi7DeviceRecoveryHarnessPageAllowed(
  input: Omit<Ai7DeviceRecoveryHarnessGateInput, "isNativePlatform"> = {},
): boolean {
  return evaluateAi7DeviceRecoveryHarnessGate({
    ...input,
    isNativePlatform: true,
  }).pageAllowed;
}
