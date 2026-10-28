import { describe, expect, it } from "vitest";
import { classify, colorsFor, LAYERS, NO_DATA } from "./layers.js";

const entity = (layers, extra = {}) => ({ code: "XXX", name: "X", kind: "sovereign", layers, ...extra });
const value = (v) => ({ value: v, asOf: "2026-10-27" });
const layer = (id) => LAYERS.find((l) => l.id === id);

describe("map layers", () => {
  it("offers the four layers the PRD lists", () => {
    expect(LAYERS.map((l) => l.label)).toEqual(["Government type", "Democracy score", "Population", "Armed conflict"]);
  });

  it("groups government types into three validated colors and Other", () => {
    const government = layer("governmentType");
    const group = (type) => classify(government, entity({ governmentType: value(type) }))?.label;

    expect(group("Semi-presidential republic")).toBe("Presidential or semi-presidential republic");
    expect(group("Directorial republic")).toBe("Parliamentary republic");
    expect(group("Absolute monarchy")).toBe("Monarchy");
    expect(group("One-party state")).toBe("Other or unspecified");
  });

  it("bins democracy scores in fifths, the top bin closed at 1", () => {
    const democracy = layer("democracyScore");
    const bin = (score) => classify(democracy, entity({ democracyScore: value(score) })).label;

    expect([bin(0), bin(0.2), bin(0.799), bin(1)]).toEqual(["0–0.2", "0.2–0.4", "0.6–0.8", "0.8–1"]);
  });

  it("bins population on a log scale", () => {
    const population = layer("population");
    const bin = (people) => classify(population, entity({ population: value(people) })).label;

    expect([bin(500_000), bin(5_000_000), bin(68_000_000), bin(1_400_000_000)])
      .toEqual(["Under 1 million", "1–10 million", "50–200 million", "200 million or more"]);
  });

  it("separates countries with an active armed conflict from those with none recorded", () => {
    const conflict = layer("conflictStatus");

    expect(classify(conflict, entity({ conflictStatus: value("active_conflict") })).label).toBe("Active armed conflict");
    expect(classify(conflict, entity({ conflictStatus: value("none") })).label).toBe("None recorded");
  });

  it("treats a missing value, and any territory, as no data", () => {
    const democracy = layer("democracyScore");

    expect(classify(democracy, entity({ democracyScore: null }))).toBeNull();
    expect(classify(democracy, entity(null, { kind: "territory" }))).toBeNull();
  });

  it("colors every entity, using the no-data color where a value is missing", () => {
    const colors = colorsFor(layer("conflictStatus"), [
      entity({ conflictStatus: value("active_conflict") }, { code: "SDN" }),
      entity({ conflictStatus: null }, { code: "TWN" }),
    ]);

    expect(colors).toEqual(new Map([["SDN", "#d03b3b"], ["TWN", NO_DATA]]));
  });
});
