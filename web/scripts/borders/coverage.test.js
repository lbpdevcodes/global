import { describe, expect, it } from "vitest";
import { coverageGaps, NOT_SELECTABLE } from "./coverage.js";

const entity = (code, extra = {}) => ({ code, kind: "sovereign", centroid: { lat: 0, lng: 0 }, ...extra });

describe("coverageGaps", () => {
  it("finds nothing when every profiled entity has a shape or a centroid", () => {
    expect(coverageGaps([entity("FRA"), entity("TUV")], ["FRA"])).toEqual({ unclickable: [], unknownShapes: [] });
  });

  it("reports a profiled entity with neither a shape nor a centroid", () => {
    expect(coverageGaps([entity("NRU", { centroid: null })], []).unclickable).toEqual(["NRU"]);
  });

  it("reports a border shape that is neither in the index nor reviewed as not selectable", () => {
    expect(coverageGaps([entity("FRA")], ["FRA", "XYZ", ...NOT_SELECTABLE]).unknownShapes).toEqual(["XYZ"]);
  });
});
