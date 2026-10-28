import { describe, expect, it } from "vitest";
import { searchEntities } from "./search.js";

const entity = (code, name, aliases = []) => ({ code, name, aliases, kind: "sovereign", parent: null });
const entities = [
  entity("NLD", "Netherlands", ["Holland", "Kingdom of the Netherlands"]),
  entity("CIV", "Ivory Coast", ["Côte d'Ivoire"]),
  entity("NER", "Niger"),
  entity("NGA", "Nigeria"),
  entity("BIH", "Bosnia and Herzegovina"),
  entity("FRA", "France", ["French Republic"]),
];
const codes = (query, limit) => searchEntities(entities, query, limit).map((e) => e.code);

describe("searchEntities", () => {
  it("finds a country by the start of its name, ignoring case", () => {
    expect(codes("fra")).toEqual(["FRA"]);
  });

  it("finds a country by an alternate name", () => {
    expect(codes("holland")).toEqual(["NLD"]);
  });

  it("ignores accents in both the query and the names", () => {
    expect(codes("cote d")).toEqual(["CIV"]);
  });

  it("ranks names that start with the query above names that only contain it", () => {
    expect(codes("ni")).toEqual(["NER", "NGA", "BIH"]);
  });

  it("returns nothing for a blank query", () => {
    expect(codes("  ")).toEqual([]);
  });

  it("returns at most the requested number of results", () => {
    expect(codes("n", 2)).toHaveLength(2);
  });
});
