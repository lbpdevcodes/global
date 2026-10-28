import { describe, expect, it } from "vitest";
import { dotTargets } from "./dots.js";

const square = (code, lng, lat, size) => ({
  type: "Feature",
  properties: { code },
  geometry: { type: "Polygon", coordinates: [[[lng, lat], [lng, lat + size], [lng + size, lat + size], [lng + size, lat], [lng, lat]]] },
});
const entity = (code, kind = "sovereign") => ({ code, name: code, kind, centroid: { lat: 1, lng: 2 } });

describe("dotTargets", () => {
  it("puts a dot on a state too small to click", () => {
    expect(dotTargets([square("VAT", 12.45, 41.9, 0.005)], [entity("VAT")]).map((d) => d.code)).toEqual(["VAT"]);
  });

  it("leaves a large state without a dot", () => {
    expect(dotTargets([square("FRA", -4, 42, 8)], [entity("FRA")])).toEqual([]);
  });

  it("puts a dot at the centroid of a profiled state with no shape at all", () => {
    expect(dotTargets([], [entity("TUV")])).toEqual([{ code: "TUV", name: "TUV", lat: 1, lng: 2 }]);
  });

  it("gives territories no dots", () => {
    expect(dotTargets([], [entity("BMU", "territory")])).toEqual([]);
  });
});
