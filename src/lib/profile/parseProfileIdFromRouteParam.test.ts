import { describe, expect, it } from "vitest";

import { parseProfileIdFromRouteParam } from "./parseProfileIdFromRouteParam";

describe("parseProfileIdFromRouteParam", () => {
  it("decodes legacy colon in path", () => {
    expect(parseProfileIdFromRouteParam("legacy%3A1888dd05fa3c123c1b723aeeb371acc2")).toBe(
      "legacy:1888dd05fa3c123c1b723aeeb371acc2",
    );
  });

  it("leaves already-decoded ids unchanged", () => {
    const id = "legacy:1888dd05fa3c123c1b723aeeb371acc2";
    expect(parseProfileIdFromRouteParam(id)).toBe(id);
  });

  it("leaves cuid unchanged", () => {
    const id = "cmoomthbz0000l7047ngrx3co";
    expect(parseProfileIdFromRouteParam(id)).toBe(id);
  });
});
