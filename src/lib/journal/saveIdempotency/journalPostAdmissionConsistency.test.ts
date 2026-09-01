/**
 * AI-X6.8B0.6 — POST admission ↔ capability admission consistency.
 *
 * Proves the shared eligibility predicate that Journal POST and
 * save-capability both use after the release-branch semantic merge.
 */

import { describe, expect, it } from "vitest";

import {
  isJournalSaveIdempotencyRolloutEligible,
  resolveSaveCapability,
  type RolloutRow,
  type SaveCapabilityWriteActorMode,
} from "@/lib/journal/saveIdempotency/rolloutProtocol";

type Scenario = {
  name: string;
  globalEnabled: boolean;
  rollout: RolloutRow | null;
  writeActorMode: SaveCapabilityWriteActorMode;
  expectPostAdmitted: boolean;
  expectIdempotent: boolean;
  expectStableActorAdmission: boolean;
};

function classify(s: Omit<Scenario, "name">) {
  const capability = resolveSaveCapability({
    globalEnabled: s.globalEnabled,
    rollout: s.rollout,
    writeActorMode: s.writeActorMode,
  });
  const postAdmitted = isJournalSaveIdempotencyRolloutEligible({
    globalEnabled: s.globalEnabled,
    rollout: s.rollout,
  });
  return { capability, postAdmitted };
}

describe("AI-X6.8B0.6 POST / capability admission contract", () => {
  const cases: Scenario[] = [
    {
      name: "A: global ON + stable write OFF + no rollout → POST denied",
      globalEnabled: true,
      rollout: null,
      writeActorMode: "legacy",
      expectPostAdmitted: false,
      expectIdempotent: false,
      expectStableActorAdmission: false,
    },
    {
      name: "B: legacy rollout enabled + stable write OFF → legacy idempotent admitted",
      globalEnabled: true,
      rollout: { enabled: true, protocolVersion: 1 },
      writeActorMode: "legacy",
      expectPostAdmitted: true,
      expectIdempotent: true,
      expectStableActorAdmission: false,
    },
    {
      name: "C: stable write ON + no firebase rollout → POST denied",
      globalEnabled: true,
      rollout: null,
      writeActorMode: "stable",
      expectPostAdmitted: false,
      expectIdempotent: false,
      expectStableActorAdmission: false,
    },
    {
      name: "D: stable write ON + firebase rollout disabled → POST denied",
      globalEnabled: true,
      rollout: { enabled: false, protocolVersion: 1 },
      writeActorMode: "stable",
      expectPostAdmitted: false,
      expectIdempotent: false,
      expectStableActorAdmission: false,
    },
    {
      name: "E: stable write ON + firebase rollout enabled → POST + stable admission",
      globalEnabled: true,
      rollout: { enabled: true, protocolVersion: 1 },
      writeActorMode: "stable",
      expectPostAdmitted: true,
      expectIdempotent: true,
      expectStableActorAdmission: true,
    },
    {
      name: "F: legacy rollout row must not produce stableActorAdmission",
      globalEnabled: true,
      rollout: { enabled: true, protocolVersion: 1 },
      writeActorMode: "legacy",
      expectPostAdmitted: true,
      expectIdempotent: true,
      expectStableActorAdmission: false,
    },
    {
      name: "G: non-canary N — stable globals ON conceptually, no firebase rollout → no JSO/stable",
      globalEnabled: true,
      rollout: null,
      writeActorMode: "stable",
      expectPostAdmitted: false,
      expectIdempotent: false,
      expectStableActorAdmission: false,
    },
    {
      name: "H: unbound U modeled as no stable admission (rollout absent / disabled)",
      globalEnabled: true,
      rollout: null,
      writeActorMode: "stable",
      expectPostAdmitted: false,
      expectIdempotent: false,
      expectStableActorAdmission: false,
    },
  ];

  it.each(cases)("$name", (scenario) => {
    const { capability, postAdmitted } = classify(scenario);
    expect(postAdmitted).toBe(scenario.expectPostAdmitted);
    expect(capability.idempotentSaveEnabled).toBe(scenario.expectIdempotent);
    expect(capability.stableActorAdmission).toBe(scenario.expectStableActorAdmission);
    // Hard invariant: capability never admits what POST would deny.
    expect(capability.idempotentSaveEnabled).toBe(postAdmitted);
    if (capability.stableActorAdmission) {
      expect(postAdmitted).toBe(true);
      expect(capability.idempotentSaveEnabled).toBe(true);
    }
  });

  it("global OFF alone never admits POST or stable pending", () => {
    const { capability, postAdmitted } = classify({
      globalEnabled: false,
      rollout: { enabled: true, protocolVersion: 1 },
      writeActorMode: "stable",
      expectPostAdmitted: false,
      expectIdempotent: false,
      expectStableActorAdmission: false,
    });
    expect(postAdmitted).toBe(false);
    expect(capability.idempotentSaveEnabled).toBe(false);
    expect(capability.stableActorAdmission).toBe(false);
  });
});
