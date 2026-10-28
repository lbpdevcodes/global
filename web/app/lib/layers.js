// The four map layers (PRD F4). Colors come from the data-viz reference
// palette, validated against the globe's ocean (#0b1424) with every pair
// compared, as a choropleth requires: only three categorical hues pass that
// test, so government types fold into three groups plus a neutral "Other".
// Every class has a text label, used by the legend, the hover label and the
// list view, so color is never the only cue.

export const NO_DATA = "#273044";
const OTHER = "#7b8394";

// Sequential blue, dark (low) to light (high) on the dark globe.
const BLUES = ["#184f95", "#1c5cab", "#2a78d6", "#5598e7", "#9ec5f4"];

const GOVERNMENT_GROUPS = [
  { label: "Presidential or semi-presidential republic", color: "#3987e5",
    types: ["Presidential republic", "Semi-presidential republic"] },
  { label: "Parliamentary republic", color: "#d95926", types: ["Parliamentary republic", "Directorial republic"] },
  { label: "Monarchy", color: "#199e70", types: ["Constitutional monarchy", "Absolute monarchy", "Monarchy"] },
];

function binned(edges, labels) {
  return labels.map((label, index) => ({
    label,
    color: BLUES[index],
    test: (value) => value >= edges[index] && (index === labels.length - 1 || value < edges[index + 1]),
  }));
}

export const LAYERS = [
  {
    id: "governmentType",
    label: "Government type",
    classes: [
      ...GOVERNMENT_GROUPS.map(({ label, color, types }) => ({ label, color, test: (type) => types.includes(type) })),
      { label: "Other or unspecified", color: OTHER, test: () => true },
    ],
    describe: (value) => value,
  },
  {
    id: "democracyScore",
    label: "Democracy score",
    note: "V-Dem Electoral Democracy Index, 0 to 1",
    classes: binned([0, 0.2, 0.4, 0.6, 0.8], ["0–0.2", "0.2–0.4", "0.4–0.6", "0.6–0.8", "0.8–1"]),
    describe: (value) => value.toFixed(2),
  },
  {
    id: "population",
    label: "Population",
    note: "Log scale",
    classes: binned([0, 1e6, 1e7, 5e7, 2e8],
      ["Under 1 million", "1–10 million", "10–50 million", "50–200 million", "200 million or more"]),
    describe: (value) => new Intl.NumberFormat("en-US").format(value),
  },
  {
    id: "conflictStatus",
    label: "Armed conflict",
    note: "UCDP, latest year",
    classes: [
      { label: "Active armed conflict", color: "#d03b3b", test: (value) => value === "active_conflict" },
      { label: "Tension or dispute", color: "#ec835a", test: (value) => value === "tension" },
      { label: "None recorded", color: OTHER, test: (value) => value === "none" },
    ],
    describe: (value) => ({ active_conflict: "Active armed conflict", tension: "Tension or dispute", none: "None recorded" })[value],
  },
];

// The class an entity falls in for a layer, or null when it has no data.
export function classify(layer, entity) {
  const value = entity.layers?.[layer.id]?.value;
  if (entity.kind === "territory" || value === undefined || value === null) return null;
  return layer.classes.find((candidate) => candidate.test(value)) ?? null;
}

export function colorsFor(layer, entities) {
  return new Map(entities.map((entity) => [entity.code, classify(layer, entity)?.color ?? NO_DATA]));
}
