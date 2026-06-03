import assert from "node:assert/strict";
import test from "node:test";

import { parseProfileIdFromRouteParam } from "./parseProfileIdFromRouteParam";

test("parseProfileIdFromRouteParam decodes legacy colon in path", () => {
  assert.equal(
    parseProfileIdFromRouteParam("legacy%3A1888dd05fa3c123c1b723aeeb371acc2"),
    "legacy:1888dd05fa3c123c1b723aeeb371acc2",
  );
});

test("parseProfileIdFromRouteParam leaves already-decoded ids unchanged", () => {
  const id = "legacy:1888dd05fa3c123c1b723aeeb371acc2";
  assert.equal(parseProfileIdFromRouteParam(id), id);
});

test("parseProfileIdFromRouteParam leaves cuid unchanged", () => {
  const id = "cmoomthbz0000l7047ngrx3co";
  assert.equal(parseProfileIdFromRouteParam(id), id);
});
