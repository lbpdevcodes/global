// Natural Earth shapes deliberately left unselectable (docs/adr/0004): areas
// that are not profiled and fold into no single profile. Their disputed-area
// overlay still shows Natural Earth's note.
export const NOT_SELECTABLE = ["ATA", "CYN", "KAS", "SOL"];

// What keeps the globe from covering every entity: profiled entities with no
// shape and no centroid for a dot, and shapes nobody has accounted for.
export function coverageGaps(entities, shapeCodes) {
  const shapes = new Set(shapeCodes);
  const known = new Set([...entities.map((entity) => entity.code), ...NOT_SELECTABLE]);
  return {
    unclickable: entities
      .filter((entity) => entity.kind !== "territory" && !shapes.has(entity.code) && !entity.centroid)
      .map((entity) => entity.code),
    unknownShapes: [...shapes].filter((code) => !known.has(code)).sort(),
  };
}
