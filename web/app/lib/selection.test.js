import { describe, expect, it } from "vitest";
import { resolveSelection } from "./selection.js";

const denmark = { code: "DNK", name: "Denmark", kind: "sovereign", parent: null };
const greenland = { code: "GRL", name: "Greenland", kind: "territory", parent: "DNK" };
const entities = [denmark, greenland];

describe("resolveSelection", () => {
  it("opens a profiled entity's own profile and focuses it", () => {
    expect(resolveSelection(entities, "DNK")).toEqual({ profile: denmark, focus: denmark, territory: null });
  });

  it("accepts a lowercase code from the URL", () => {
    expect(resolveSelection(entities, "dnk")?.profile).toBe(denmark);
  });

  it("opens a territory's parent profile while focusing the territory", () => {
    expect(resolveSelection(entities, "GRL")).toEqual({ profile: denmark, focus: greenland, territory: greenland });
  });

  it("returns null for a code that is not in the index", () => {
    expect(resolveSelection(entities, "ZZZ")).toBeNull();
  });
});
