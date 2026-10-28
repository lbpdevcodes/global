// Fails when any profiled entity cannot be selected on the globe, or a border
// shape is unaccounted for. Runs against a published snapshot:
//   node scripts/check-coverage.js [snapshot dir, default data/v1]
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { coverageGaps } from "./borders/coverage.js";

const snapshot = process.argv[2] ?? "data/v1";
const { entities } = JSON.parse(readFileSync(join(snapshot, "index.json"), "utf8"));
const topology = JSON.parse(readFileSync(new URL("../public/borders-50m.topo.json", import.meta.url), "utf8"));
const shapeCodes = topology.objects.countries.geometries.map((geometry) => geometry.properties.code);
const { unclickable, unknownShapes } = coverageGaps(entities, shapeCodes);
const profiled = entities.filter((entity) => entity.kind !== "territory").length;

if (unclickable.length) console.error(`Not selectable (no shape, no centroid): ${unclickable.join(", ")}`);
if (unknownShapes.length) console.error(`Border shapes missing from the index: ${unknownShapes.join(", ")}`);
if (unclickable.length || unknownShapes.length) process.exit(1);
console.log(`Coverage OK: ${profiled} profiled entities selectable; ${new Set(shapeCodes).size} border codes accounted for.`);
