// Builds public/borders-50m.topo.json from Natural Earth 1:50m (public domain).
// Borders change rarely, so the output is committed; rerun after a Natural
// Earth upgrade:  node scripts/build-borders.js [--simplify=12%]
import { writeFile } from "node:fs/promises";
import { gzipSync } from "node:zlib";
import mapshaper from "mapshaper";
import { applyDisputedOverrides } from "./borders/disputed-overrides.js";
import { featureCode } from "./borders/feature-code.js";

const NATURAL_EARTH = "https://raw.githubusercontent.com/nvkelso/natural-earth-vector/v5.1.2/geojson";
const OUTPUT = new URL("../public/borders-50m.topo.json", import.meta.url);
const simplify = process.argv.find((arg) => arg.startsWith("--simplify="))?.split("=")[1] ?? "12%";

async function download(name) {
  const response = await fetch(`${NATURAL_EARTH}/${name}.geojson`);
  if (!response.ok) throw new Error(`Natural Earth ${name}: HTTP ${response.status}`);
  return response.json();
}

function keepOnly(collection, propertiesOf) {
  return {
    type: "FeatureCollection",
    features: collection.features.map((feature) => ({ ...feature, properties: propertiesOf(feature.properties) })),
  };
}

const countries = keepOnly(await download("ne_50m_admin_0_countries"), (p) => ({ code: featureCode(p), name: p.NAME }));
const reported = keepOnly(await download("ne_50m_admin_0_breakaway_disputed_areas"), (p) => ({
  id: p.BRK_A3,
  name: p.BRK_NAME,
  note: p.NOTE_BRK,
}));
const disputed = { ...reported, features: applyDisputedOverrides(reported.features) };

const output = await mapshaper.applyCommands(
  `-i countries.json disputed.json combine-files -simplify ${simplify} keep-shapes ` +
    "-o format=topojson quantization=100000 borders.json",
  { "countries.json": JSON.stringify(countries), "disputed.json": JSON.stringify(disputed) },
);
const topology = output["borders.json"];
await writeFile(OUTPUT, topology);

const codes = new Set(countries.features.map((f) => f.properties.code));
console.log(`countries: ${countries.features.length} features, ${codes.size} codes`);
console.log(`disputed: ${disputed.features.length} areas`);
console.log(`size: ${(topology.length / 1024).toFixed(0)} KB raw, ${(gzipSync(topology).length / 1024).toFixed(0)} KB gzip`);
