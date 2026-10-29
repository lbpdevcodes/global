import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import Ajv2020 from "ajv/dist/2020.js";
import addFormats from "ajv-formats";
import { describe, expect, it } from "vitest";

const contracts = join(import.meta.dirname, "../../contracts");
const readJson = (...path) => JSON.parse(readFileSync(join(contracts, ...path), "utf8"));

const ajv = new Ajv2020({ allErrors: true });
addFormats(ajv);
const validators = Object.fromEntries(
  ["country", "index", "manifest"].map((name) => [name, ajv.compile(readJson("v1", `${name}.schema.json`))]),
);

function errorsFor(name, document) {
  const validate = validators[name];
  return validate(document) ? [] : validate.errors.map((e) => `${e.instancePath} ${e.message}`);
}

describe("contract examples the reader is tested against", () => {
  it("have a valid manifest", () => {
    expect(errorsFor("manifest", readJson("examples", "manifest.json"))).toEqual([]);
  });

  it("have a valid index", () => {
    expect(errorsFor("index", readJson("examples", "index.json"))).toEqual([]);
  });

  const countryFiles = readdirSync(join(contracts, "examples", "countries"));

  it.each(countryFiles)("have a valid %s profile", (file) => {
    expect(errorsFor("country", readJson("examples", "countries", file))).toEqual([]);
  });

  it("are rejected when a fact has no source", () => {
    const profile = readJson("examples", "countries", "FRA.json");
    delete profile.header.capital.source;

    expect(errorsFor("country", profile).join()).toContain("/header/capital");
  });

  it("are rejected when a layer value has the wrong type", () => {
    const index = readJson("examples", "index.json");
    index.entities.find((entity) => entity.code === "FRA").layers.gdpPerCapita = { value: "46150", asOf: "2026-10-27" };

    expect(errorsFor("index", index).join()).toContain("/layers/gdpPerCapita/value");
  });
});
