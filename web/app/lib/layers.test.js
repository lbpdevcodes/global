import { describe, expect, it } from "vitest";
import { blocLayer, blocsIn, classify, colorsFor, electionsLayer, LAYERS, NO_DATA, noDataLabel } from "./layers.js";

const entity = (layers, extra = {}) => ({ code: "XXX", name: "X", kind: "sovereign", layers, ...extra });
const value = (v) => ({ value: v, asOf: "2026-10-27" });
const layer = (id) => LAYERS.find((l) => l.id === id);

describe("map layers", () => {
  it("offers the PRD's four layers, then the ones added after v1", () => {
    expect(LAYERS.map((l) => l.label)).toEqual([
      "Government type", "Democracy score", "Population", "Armed conflict",
      "GDP per person", "Alliance or bloc", "Upcoming elections",
    ]);
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

  it("bins GDP per person in US dollars, each bin closed at its lower edge", () => {
    const gdp = layer("gdpPerCapita");
    const bin = (dollars) => classify(gdp, entity({ gdpPerCapita: value(dollars) })).label;

    expect([bin(999), bin(1_000), bin(3_999), bin(4_000), bin(15_000), bin(40_000)]).toEqual([
      "Under $1,000", "$1,000–4,000", "$1,000–4,000", "$4,000–15,000", "$15,000–40,000", "$40,000 or more",
    ]);
  });

  it("describes GDP per person as the panel does", () => {
    expect(layer("gdpPerCapita").describe(46_150.4)).toBe("US$46,150");
  });

  it("separates a chosen bloc's members from the countries outside it", () => {
    const eu = blocLayer("EU");
    const group = (blocs) => classify(eu, entity({ alliances: value(blocs) }))?.label;

    expect([group(["UN", "NATO", "EU"]), group(["UN", "NATO"]), group([])]).toEqual(["Member of EU", "Not a member", "Not a member"]);
    expect(classify(eu, entity({ alliances: null }))).toBeNull();
  });

  it("describes a country by its membership in the chosen bloc, not by every bloc it belongs to", () => {
    expect([blocLayer("EU").describe(["UN", "EU"]), blocLayer("EU").describe(["UN"])]).toEqual(["Member", "Not a member"]);
  });

  it("offers every bloc a country belongs to except the UN, which every country belongs to", () => {
    const entities = [
      entity({ alliances: value(["UN", "NATO", "EU"]) }),
      entity({ alliances: value(["UN", "African Union"]) }),
      entity({ alliances: null }),
      entity(null, { kind: "territory" }),
    ];

    expect(blocsIn(entities)).toEqual(["African Union", "EU", "NATO"]);
  });

  describe("upcoming elections", () => {
    const elections = electionsLayer(new Date(2026, 9, 29));
    const group = (date) => classify(elections, entity({ nextElection: value({ type: "General", date }) }))?.label;

    it("groups elections by how soon they will certainly have happened, counting whole days from today", () => {
      expect([group("2026-10-29"), group("2026-11-28"), group("2026-11-29"), group("2027-01-27"), group("2027-01-28")])
        .toEqual(["Within 30 days", "Within 30 days", "Within 90 days", "Within 90 days", "Later, or date not yet fixed"]);
    });

    it("places a month or year by its last day, so a bare year is never shown as imminent", () => {
      expect([group("2026-10"), group("2026-11"), group("2026"), group("2027")])
        .toEqual(["Within 30 days", "Within 90 days", "Within 90 days", "Later, or date not yet fixed"]);
    });

    it("describes an election by its type and the date as precisely as the source gives it", () => {
      expect(elections.describe({ type: "Presidential", date: "2027" })).toBe("Presidential, 2027");
    });

    it("says no date is known where other layers say no data, since most countries have no dated election", () => {
      expect([noDataLabel(elections), noDataLabel(layer("population"))]).toEqual(["No date known", "No data"]);
    });

    it("treats an election already past as no data, since the source has not caught up", () => {
      expect([group("2026-10-28"), group("2026-09"), group("2025")]).toEqual([undefined, undefined, undefined]);
    });
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
