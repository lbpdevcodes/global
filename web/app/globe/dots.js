import { geoArea } from "d3-geo";

// About 6,000 km² in steradians: below this a shape is too small to tap.
const TOO_SMALL = 1.5e-4;

// Profiled states that need a clickable dot: tiny shapes, or no shape at all.
export function dotTargets(features, entities) {
  const areaByCode = new Map();
  for (const feature of features) {
    const { code } = feature.properties;
    areaByCode.set(code, (areaByCode.get(code) ?? 0) + geoArea(feature));
  }
  return entities
    .filter((entity) => entity.kind !== "territory" && entity.centroid)
    .filter((entity) => (areaByCode.get(entity.code) ?? 0) < TOO_SMALL)
    .map(({ code, name, centroid }) => ({ code, name, lat: centroid.lat, lng: centroid.lng }));
}
