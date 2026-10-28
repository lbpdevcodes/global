import { describe, expect, it } from "vitest";
import { applyDisputedOverrides, WITHDRAWN } from "./disputed-overrides.js";

const area = (id, name) => ({ type: "Feature", properties: { id, name, note: "note" }, geometry: null });

describe("applyDisputedOverrides", () => {
  it("drops the areas withdrawn after review", () => {
    const kept = applyDisputedOverrides([area("B38", "Artsakh"), area("B89", "Crimea")]);

    expect(kept.map((feature) => feature.properties.name)).toEqual(["Crimea"]);
  });

  it("records a reason for every withdrawal", () => {
    expect(Object.values(WITHDRAWN).every((reason) => reason.length > 20)).toBe(true);
  });
});
