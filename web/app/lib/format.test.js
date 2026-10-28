import { describe, expect, it } from "vitest";
import { formatAsOf, formatValue, isStale } from "./format.js";

describe("formatValue", () => {
  it("groups the digits of a population", () => {
    expect(formatValue("people.population", 68170000)).toBe("68,170,000");
  });

  it("states GDP in compact US dollars", () => {
    expect(formatValue("economy.gdpUsd", 3160000000000)).toBe("US$3.16 trillion");
    expect(formatValue("economy.gdpPerCapitaUsd", 46150)).toBe("US$46,150");
  });

  it("joins a list of names", () => {
    expect(formatValue("people.officialLanguages", ["French", "Breton"])).toBe("French, Breton");
  });

  it("describes an office holder with the year they took office", () => {
    const holder = { name: "Emmanuel Macron", title: "President", since: "2017-05-14" };
    expect(formatValue("leadership.headOfState", holder)).toBe("Emmanuel Macron, President (since 2017)");
  });

  it("leaves out the start year when the source has none", () => {
    expect(formatValue("leadership.headOfGovernment", { name: "Luc Frieden", title: "Prime Minister", since: null }))
      .toBe("Luc Frieden, Prime Minister");
  });

  it("describes the next election by type and date", () => {
    expect(formatValue("leadership.nextNationalElection", { type: "Presidential", date: "2027" })).toBe("Presidential, 2027");
  });

  it("states a democracy score against its scale and names the index", () => {
    const score = { score: 0.82, index: "V-Dem Electoral Democracy Index", scaleMin: 0, scaleMax: 1 };
    expect(formatValue("government.democracyScore", score)).toBe("0.82 on a 0–1 scale (V-Dem Electoral Democracy Index)");
  });

  it("lists exports with their share", () => {
    expect(formatValue("economy.topExports", [{ product: "Aircraft", sharePercent: 9 }])).toBe("Aircraft (9%)");
  });

  it("lists parties with ideology and seats when known", () => {
    const parties = [{ name: "Renaissance", ideology: "Liberalism", seats: 91 }, { name: "Other", ideology: null, seats: null }];
    expect(formatValue("politics.majorParties", parties)).toBe("Renaissance (Liberalism, 91 seats), Other");
  });

  it("uses the note to describe recognition, falling back to the status", () => {
    expect(formatValue("government.recognitionStatus", { status: "partial", note: "Recognized by 12 states" })).toBe("Recognized by 12 states");
    expect(formatValue("government.recognitionStatus", { status: "full", note: null })).toBe("Full");
  });
});

describe("formatAsOf", () => {
  it("writes an ISO date as day, short month and year", () => {
    expect(formatAsOf("2026-10-07")).toBe("7 Oct 2026");
  });
});

describe("isStale", () => {
  const today = new Date("2026-10-27T12:00:00Z");

  it("is fresh within the refresh window plus a day of grace", () => {
    expect(isStale("2026-10-25", 1, today)).toBe(false);
  });

  it("is stale once the window and grace have passed", () => {
    expect(isStale("2026-10-24", 1, today)).toBe(true);
  });
});
