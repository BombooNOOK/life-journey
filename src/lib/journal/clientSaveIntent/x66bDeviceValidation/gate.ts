/**
 * Dev-only gate for X6.6B autorun validation harness.
 * Requires development/test NODE_ENV AND explicit NEXT_PUBLIC flag.
 * Production → fail closed (page 404 / operations blocked).
 */

import {
  X66B_DEVICE_VALIDATION_AUTORUN_FLAG,
  X66B_DEVICE_VALIDATION_AUTORUN_FLAG_VALUE,
} from "@/lib/journal/clientSaveIntent/x66bDeviceValidation/constants";

export type X66bDeviceValidationGateInput = {
  nodeEnv?: string | undefined;
  flag?: string | undefined;
};

export type X66bDeviceValidationGateResult = {
  ok: boolean;
  reason: "ok" | "production_build" | "flag_off";
  pageAllowed: boolean;
  operationsAllowed: boolean;
};

export function evaluateX66bDeviceValidationGate(
  input: X66bDeviceValidationGateInput = {},
): X66bDeviceValidationGateResult {
  const nodeEnv = (input.nodeEnv ?? process.env.NODE_ENV ?? "").trim();
  const flag = (
    input.flag ??
    process.env[X66B_DEVICE_VALIDATION_AUTORUN_FLAG] ??
    ""
  ).trim();
  const nodeEnvOk = nodeEnv !== "production";
  const flagOk = flag === X66B_DEVICE_VALIDATION_AUTORUN_FLAG_VALUE;

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
  return {
    ok: true,
    reason: "ok",
    pageAllowed: true,
    operationsAllowed: true,
  };
}

export function isX66bDeviceValidationPageAllowed(
  input: X66bDeviceValidationGateInput = {},
): boolean {
  return evaluateX66bDeviceValidationGate(input).pageAllowed;
}
