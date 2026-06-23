import { describe, expect, it } from "vitest";

import {
  ACTIVITY_BINDING_LABEL_LINES,
  getActivityBindingLabelLines,
} from "@/lib/journal/activityBindingLabelLines";
import { activityOptionIds } from "@/lib/journal/meta";

describe("activityBindingLabelLines", () => {
  it("defines binding lines for every activity option", () => {
    for (const id of activityOptionIds) {
      expect(ACTIVITY_BINDING_LABEL_LINES[id]?.length).toBeGreaterThan(0);
    }
  });

  it("uses readable two-line breaks for long labels", () => {
    expect(getActivityBindingLabelLines("work_study")).toEqual(["仕事・勉強を", "がんばった"]);
    expect(getActivityBindingLabelLines("very_happy")).toEqual([
      "とても嬉しいこと",
      "があった",
    ]);
    expect(getActivityBindingLabelLines("no_energy")).toEqual(["何もしたくない日", "だった"]);
    expect(getActivityBindingLabelLines("down")).toEqual(["うまくいかず", "落ち込んだ"]);
    expect(getActivityBindingLabelLines("record_anyway")).toEqual([
      "特別なことはない",
      "けれど、記録したい",
    ]);
  });

  it("keeps short labels on one line", () => {
    expect(getActivityBindingLabelLines("hard_day")).toEqual(["しんどかった"]);
  });
});
