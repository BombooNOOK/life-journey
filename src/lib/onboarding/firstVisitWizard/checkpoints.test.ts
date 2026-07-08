import { describe, expect, it } from "vitest";

import {
  FIRST_VISIT_NO_PAUSE_BEFORE_LOGHOUSE_BUILD_STAGES,
  FIRST_VISIT_PAUSE_CHECKPOINT_STAGES,
  isFirstVisitPauseCheckpointStage,
} from "@/lib/onboarding/firstVisitWizard/checkpoints";

describe("firstVisitCheckpoints", () => {
  it("defines three pause checkpoints with loghouse build as the first", () => {
    expect(FIRST_VISIT_PAUSE_CHECKPOINT_STAGES[0]).toBe("kantei");
    expect(FIRST_VISIT_PAUSE_CHECKPOINT_STAGES).toHaveLength(2);
  });

  it("hides pause UI before loghouse build completes", () => {
    for (const stage of FIRST_VISIT_NO_PAUSE_BEFORE_LOGHOUSE_BUILD_STAGES) {
      expect(isFirstVisitPauseCheckpointStage(stage)).toBe(false);
    }
  });

  it("marks loghouse complete as first checkpoint", () => {
    expect(isFirstVisitPauseCheckpointStage("kantei")).toBe(true);
  });
});
